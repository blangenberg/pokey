import Ajv from 'ajv';
import { ErrorCode, MetricEvent, SchemaStatus } from 'pokey-common';
import type { Schema, CreateSchemaRequest } from 'pokey-common';
import { SCHEMAS_TABLE } from '../../constants';
import { ensureAdditionalProperties } from '../../helpers/ensure-additional-properties';
import type { HandlerDependencies, Handler } from '../../adapters/types';

export function createSchemaCreateHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.SchemaCreate);
    try {
      deps.observability.trackEvent(MetricEvent.SchemaCreate);

      const body = request.body as Partial<CreateSchemaRequest> | undefined;
      if (!body?.name || !body.schemaData) {
        return { statusCode: 400, body: { error: 'Missing required fields: name, schemaData', code: ErrorCode.BadRequest } };
      }

      const name = body.name.toLowerCase();

      // Validate schema is parseable by Ajv
      const schemaData = ensureAdditionalProperties(body.schemaData as Record<string, unknown>);
      const ajv = new Ajv({ allErrors: true });
      try {
        ajv.compile(schemaData);
      } catch {
        deps.observability.logError({ message: 'Schema data cannot be compiled by Ajv', code: ErrorCode.SchemaInvalid });
        return { statusCode: 422, body: { error: 'Schema data cannot be parsed by Ajv', code: ErrorCode.SchemaInvalid } };
      }

      // Check for name conflict
      const existing = await deps.dataLayer.query<Schema>({
        tableName: SCHEMAS_TABLE,
        indexName: 'schemas-name-index',
        keyConditionExpression: '#n = :name',
        expressionAttributeNames: { '#n': 'name' },
        expressionAttributeValues: { ':name': name },
      });

      if (existing.items.length > 0) {
        return { statusCode: 409, body: { error: 'A schema with this name already exists', code: ErrorCode.SchemaNameConflict } };
      }

      const now = deps.dateTime.now();
      const id = deps.uuid.generate();

      const schema: Schema = {
        id,
        name,
        status: SchemaStatus.Active,
        schemaData,
        createdAt: now,
        updatedAt: now,
      };

      await deps.dataLayer.put(SCHEMAS_TABLE, schema as unknown as Record<string, unknown>);

      return { statusCode: 200, body: schema };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to create schema', code: ErrorCode.InternalError, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.InternalError } };
    } finally {
      endTimer();
    }
  };
}
