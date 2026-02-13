import Ajv from 'ajv';
import { ErrorCode, MetricEvent, SchemaStatus, ConfigStatus } from 'pokey-common';
import type { Schema, Config, CreateConfigRequest } from 'pokey-common';
import { SCHEMAS_TABLE, CONFIGURATIONS_TABLE } from '../../constants';
import type { HandlerDependencies, Handler } from '../../adapters/types';

export function createConfigCreateHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.CONFIG_CREATE);
    try {
      deps.observability.trackEvent(MetricEvent.CONFIG_CREATE);

      const body = request.body as Partial<CreateConfigRequest> | undefined;
      if (!body?.name || !body.schemaId || !body.configData) {
        return {
          statusCode: 400,
          body: { error: 'Missing required fields: name, schemaId, configData', code: ErrorCode.BAD_REQUEST },
        };
      }

      const name = body.name.toLowerCase();

      const schema = await deps.dataLayer.get<Schema>(SCHEMAS_TABLE, { id: body.schemaId });
      if (!schema) {
        return { statusCode: 404, body: { error: 'Schema not found', code: ErrorCode.SCHEMA_NOT_FOUND } };
      }
      if (schema.status !== SchemaStatus.ACTIVE) {
        return { statusCode: 400, body: { error: 'Schema is not active', code: ErrorCode.SCHEMA_DISABLED } };
      }

      const ajv = new Ajv({ allErrors: true });
      let validate: ReturnType<Ajv['compile']>;
      try {
        validate = ajv.compile(schema.schemaData);
      } catch {
        deps.observability.logError({ message: 'Stored schema cannot be compiled', code: ErrorCode.SCHEMA_INVALID });
        return { statusCode: 422, body: { error: 'Stored schema is malformed', code: ErrorCode.SCHEMA_INVALID } };
      }

      if (!validate(body.configData)) {
        return {
          statusCode: 406,
          body: { error: 'configData does not conform to the schema', code: ErrorCode.CONFIG_DATA_INVALID, details: validate.errors },
        };
      }

      const existing = await deps.dataLayer.query<Config>({
        tableName: CONFIGURATIONS_TABLE,
        indexName: 'configs-name-index',
        keyConditionExpression: '#n = :name',
        expressionAttributeNames: { '#n': 'name' },
        expressionAttributeValues: { ':name': name },
      });

      if (existing.items.length > 0) {
        return { statusCode: 409, body: { error: 'A configuration with this name already exists', code: ErrorCode.CONFIG_NAME_CONFLICT } };
      }

      const now = deps.dateTime.now();
      const id = deps.uuid.generate();

      const config: Config = {
        id,
        name,
        schemaId: body.schemaId,
        status: ConfigStatus.ACTIVE,
        configData: body.configData,
        createdAt: now,
        updatedAt: now,
      };

      await deps.dataLayer.put(CONFIGURATIONS_TABLE, config as unknown as Record<string, unknown>);

      return { statusCode: 200, body: config };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to create config', code: ErrorCode.INTERNAL_ERROR, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR } };
    } finally {
      endTimer();
    }
  };
}
