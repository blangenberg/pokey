import { ErrorCode, MetricEvent, SchemaStatus } from 'pokey-common';
import type { Schema } from 'pokey-common';
import { SCHEMAS_TABLE } from '../../constants';
import type { HandlerDependencies, Handler } from '../../adapters/types';

export function createSchemaDisableHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.SchemaDisable);
    try {
      deps.observability.trackEvent(MetricEvent.SchemaDisable);

      const id = request.pathParameters['id'];
      if (!id) {
        return { statusCode: 400, body: { error: 'Missing path parameter: id', code: ErrorCode.BadRequest } };
      }

      const existing = await deps.dataLayer.get<Schema>(SCHEMAS_TABLE, { id });
      if (!existing) {
        return { statusCode: 404, body: { error: 'Schema not found', code: ErrorCode.SchemaNotFound } };
      }

      const now = deps.dateTime.now();

      await deps.dataLayer.update(
        SCHEMAS_TABLE,
        { id },
        {
          status: SchemaStatus.Disabled,
          updatedAt: now,
        },
      );

      const updated: Schema = { ...existing, status: SchemaStatus.Disabled, updatedAt: now };
      return { statusCode: 200, body: updated };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to disable schema', code: ErrorCode.InternalError, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.InternalError } };
    } finally {
      endTimer();
    }
  };
}
