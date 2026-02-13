import Ajv from 'ajv';
import { ErrorCode, MetricEvent, SchemaStatus } from 'pokey-common';
import type { Schema, CreateSchemaRequest } from 'pokey-common';
import { SCHEMAS_TABLE } from '../../constants';
import { ensureAdditionalProperties } from '../../utils/ensure-additional-properties';
import type { HandlerDependencies, Handler } from '../../adapters/types';

export function createSchemaCreateHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.SCHEMA_CREATE);
    try {
      deps.observability.trackEvent(MetricEvent.SCHEMA_CREATE);

      const body = request.body as Partial<CreateSchemaRequest> | undefined;
      if (!body?.name || !body.schemaData) {
        return { statusCode: 400, body: { error: 'Missing required fields: name, schemaData', code: ErrorCode.BAD_REQUEST } };
      }

      const name = body.name.toLowerCase();

      const schemaData = ensureAdditionalProperties(body.schemaData as Record<string, unknown>);
      const ajv = new Ajv({ allErrors: true });
      try {
        ajv.compile(schemaData);
      } catch {
        deps.observability.logError({ message: 'Schema data cannot be compiled by Ajv', code: ErrorCode.SCHEMA_INVALID });
        return { statusCode: 422, body: { error: 'Schema data cannot be parsed by Ajv', code: ErrorCode.SCHEMA_INVALID } };
      }

      const existing = await deps.dataLayer.query<Schema>({
        tableName: SCHEMAS_TABLE,
        indexName: 'schemas-name-index',
        keyConditionExpression: '#n = :name',
        expressionAttributeNames: { '#n': 'name' },
        expressionAttributeValues: { ':name': name },
      });

      if (existing.items.length > 0) {
        return { statusCode: 409, body: { error: 'A schema with this name already exists', code: ErrorCode.SCHEMA_NAME_CONFLICT } };
      }

      const now = deps.dateTime.now();
      const id = deps.uuid.generate();

      const schema: Schema = {
        id,
        name,
        status: SchemaStatus.ACTIVE,
        schemaData,
        createdAt: now,
        updatedAt: now,
      };

      await deps.dataLayer.put(SCHEMAS_TABLE, schema as unknown as Record<string, unknown>);

      return { statusCode: 200, body: schema };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to create schema', code: ErrorCode.INTERNAL_ERROR, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR } };
    } finally {
      endTimer();
    }
  };
}
