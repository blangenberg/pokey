import Ajv from 'ajv';
import { ErrorCode, MetricEvent, SchemaStatus } from 'pokey-common';
import type { Schema, Config, UpdateConfigRequest } from 'pokey-common';
import { SCHEMAS_TABLE, CONFIGURATIONS_TABLE } from '../../constants';
import type { HandlerDependencies, Handler } from '../../adapters/types';

export function createConfigUpdateHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.ConfigUpdate);
    try {
      deps.observability.trackEvent(MetricEvent.ConfigUpdate);

      const id = request.pathParameters['id'];
      if (!id) {
        return { statusCode: 400, body: { error: 'Missing path parameter: id', code: ErrorCode.BadRequest } };
      }

      const body = request.body as Partial<UpdateConfigRequest> | undefined;
      if (!body?.schemaId || !body.configData) {
        return {
          statusCode: 400,
          body: { error: 'Missing required fields: schemaId, configData', code: ErrorCode.BadRequest },
        };
      }

      // Retrieve existing config
      const existing = await deps.dataLayer.get<Config>(CONFIGURATIONS_TABLE, { id });
      if (!existing) {
        return { statusCode: 404, body: { error: 'Configuration not found', code: ErrorCode.ConfigNotFound } };
      }

      // Fetch and validate the schema (may be a different schema if schemaId changed)
      const schema = await deps.dataLayer.get<Schema>(SCHEMAS_TABLE, { id: body.schemaId });
      if (!schema) {
        return { statusCode: 404, body: { error: 'Schema not found', code: ErrorCode.SchemaNotFound } };
      }
      if (schema.status !== SchemaStatus.Active) {
        return { statusCode: 400, body: { error: 'Schema is not active', code: ErrorCode.SchemaDisabled } };
      }

      // Validate configData against the schema
      const ajv = new Ajv({ allErrors: true });
      let validate: ReturnType<Ajv['compile']>;
      try {
        validate = ajv.compile(schema.schemaData);
      } catch {
        deps.observability.logError({ message: 'Stored schema cannot be compiled', code: ErrorCode.SchemaInvalid });
        return { statusCode: 422, body: { error: 'Stored schema is malformed', code: ErrorCode.SchemaInvalid } };
      }

      if (!validate(body.configData)) {
        return {
          statusCode: 406,
          body: { error: 'configData does not conform to the schema', code: ErrorCode.ConfigDataInvalid, details: validate.errors },
        };
      }

      // Handle optional name change
      const newName = body.name !== undefined ? body.name.toLowerCase() : existing.name;
      if (newName !== existing.name) {
        const nameCheck = await deps.dataLayer.query<Config>({
          tableName: CONFIGURATIONS_TABLE,
          indexName: 'configs-name-index',
          keyConditionExpression: '#n = :name',
          expressionAttributeNames: { '#n': 'name' },
          expressionAttributeValues: { ':name': newName },
        });

        if (nameCheck.items.length > 0) {
          return {
            statusCode: 409,
            body: { error: 'A configuration with this name already exists', code: ErrorCode.ConfigNameConflict },
          };
        }
      }

      const now = deps.dateTime.now();

      await deps.dataLayer.update(
        CONFIGURATIONS_TABLE,
        { id },
        {
          name: newName,
          schemaId: body.schemaId,
          configData: body.configData,
          updatedAt: now,
        },
      );

      const updated: Config = {
        ...existing,
        name: newName,
        schemaId: body.schemaId,
        configData: body.configData,
        updatedAt: now,
      };

      return { statusCode: 200, body: updated };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to update config', code: ErrorCode.InternalError, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.InternalError } };
    } finally {
      endTimer();
    }
  };
}
