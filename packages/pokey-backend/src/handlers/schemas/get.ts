import { ErrorCode, MetricEvent } from 'pokey-common';
import type { Schema } from 'pokey-common';
import { SCHEMAS_TABLE } from '../../constants';
import type { HandlerDependencies, Handler } from '../../adapters/types';

export function createSchemaGetHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.SchemaGet);
    try {
      deps.observability.trackEvent(MetricEvent.SchemaGet);

      const id = request.pathParameters['id'];
      if (!id) {
        return { statusCode: 400, body: { error: 'Missing path parameter: id', code: ErrorCode.BadRequest } };
      }

      const schema = await deps.dataLayer.get<Schema>(SCHEMAS_TABLE, { id });
      if (!schema) {
        return { statusCode: 404, body: { error: 'Schema not found', code: ErrorCode.SchemaNotFound } };
      }

      return { statusCode: 200, body: schema };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to get schema', code: ErrorCode.InternalError, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.InternalError } };
    } finally {
      endTimer();
    }
  };
}
