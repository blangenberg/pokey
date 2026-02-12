import { ErrorCode, MetricEvent, ConfigStatus } from 'pokey-common';
import type { Config } from 'pokey-common';
import { CONFIGURATIONS_TABLE } from '../../constants';
import type { HandlerDependencies, Handler } from '../../adapters/types';

export function createConfigDisableHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.ConfigDisable);
    try {
      deps.observability.trackEvent(MetricEvent.ConfigDisable);

      const id = request.pathParameters['id'];
      if (!id) {
        return { statusCode: 400, body: { error: 'Missing path parameter: id', code: ErrorCode.BadRequest } };
      }

      const existing = await deps.dataLayer.get<Config>(CONFIGURATIONS_TABLE, { id });
      if (!existing) {
        return { statusCode: 404, body: { error: 'Configuration not found', code: ErrorCode.ConfigNotFound } };
      }

      const now = deps.dateTime.now();

      await deps.dataLayer.update(
        CONFIGURATIONS_TABLE,
        { id },
        {
          status: ConfigStatus.Disabled,
          updatedAt: now,
        },
      );

      const updated: Config = { ...existing, status: ConfigStatus.Disabled, updatedAt: now };
      return { statusCode: 200, body: updated };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to disable config', code: ErrorCode.InternalError, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.InternalError } };
    } finally {
      endTimer();
    }
  };
}
