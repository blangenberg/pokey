import Ajv from 'ajv';
import { ErrorCode, MetricEvent } from 'pokey-common';
import type { Schema, UpdateSchemaRequest } from 'pokey-common';
import { SCHEMAS_TABLE } from '../../constants';
import { ensureAdditionalProperties } from '../../helpers/ensure-additional-properties';
import { checkSchemaCompatibility } from '../../helpers/schema-compatibility';
import type { HandlerDependencies, Handler } from '../../adapters/types';

export function createSchemaUpdateHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.SchemaUpdate);
    try {
      deps.observability.trackEvent(MetricEvent.SchemaUpdate);

      const id = request.pathParameters['id'];
      if (!id) {
        return { statusCode: 400, body: { error: 'Missing path parameter: id', code: ErrorCode.BadRequest } };
      }

      const body = request.body as Partial<UpdateSchemaRequest> | undefined;
      if (!body?.schemaData) {
        return { statusCode: 400, body: { error: 'Missing required field: schemaData', code: ErrorCode.BadRequest } };
      }

      // Retrieve existing schema
      const existing = await deps.dataLayer.get<Schema>(SCHEMAS_TABLE, { id });
      if (!existing) {
        return { statusCode: 404, body: { error: 'Schema not found', code: ErrorCode.SchemaNotFound } };
      }

      // Validate new schema with Ajv
      const newSchemaData = ensureAdditionalProperties(body.schemaData as Record<string, unknown>);
      const ajv = new Ajv({ allErrors: true });
      try {
        ajv.compile(newSchemaData);
      } catch {
        deps.observability.logError({ message: 'Updated schema data cannot be compiled by Ajv', code: ErrorCode.SchemaInvalid });
        return { statusCode: 422, body: { error: 'Schema data cannot be parsed by Ajv', code: ErrorCode.SchemaInvalid } };
      }

      // Backward-compatibility check
      const issues = checkSchemaCompatibility(existing.schemaData as Record<string, unknown>, newSchemaData);
      if (issues.length > 0) {
        deps.observability.trackError(ErrorCode.SchemaIncompatible);
        return {
          statusCode: 400,
          body: {
            error: 'Schema update is not backward-compatible',
            code: ErrorCode.SchemaIncompatible,
            details: issues,
          },
        };
      }

      // Handle optional name change
      const newName = body.name !== undefined ? body.name.toLowerCase() : existing.name;
      if (newName !== existing.name) {
        const nameCheck = await deps.dataLayer.query<Schema>({
          tableName: SCHEMAS_TABLE,
          indexName: 'schemas-name-index',
          keyConditionExpression: '#n = :name',
          expressionAttributeNames: { '#n': 'name' },
          expressionAttributeValues: { ':name': newName },
        });

        if (nameCheck.items.length > 0) {
          return { statusCode: 409, body: { error: 'A schema with this name already exists', code: ErrorCode.SchemaNameConflict } };
        }
      }

      const now = deps.dateTime.now();

      await deps.dataLayer.update(
        SCHEMAS_TABLE,
        { id },
        {
          name: newName,
          schemaData: newSchemaData,
          updatedAt: now,
        },
      );

      const updated: Schema = { ...existing, name: newName, schemaData: newSchemaData, updatedAt: now };
      return { statusCode: 200, body: updated };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to update schema', code: ErrorCode.InternalError, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.InternalError } };
    } finally {
      endTimer();
    }
  };
}
