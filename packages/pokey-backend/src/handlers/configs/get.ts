import { ErrorCode, MetricEvent, ConfigStatus } from 'pokey-common';
import type { Config } from 'pokey-common';
import { CONFIGURATIONS_TABLE } from '../../constants';
import type { HandlerDependencies, Handler } from '../../adapters/types';

export function createConfigGetHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.ConfigGet);
    try {
      deps.observability.trackEvent(MetricEvent.ConfigGet);

      const id = request.pathParameters['id'];
      if (!id) {
        return { statusCode: 400, body: { error: 'Missing path parameter: id', code: ErrorCode.BadRequest } };
      }

      const includeDisabled = request.queryParameters['includeDisabled'] === 'true';

      const config = await deps.dataLayer.get<Config>(CONFIGURATIONS_TABLE, { id });
      if (!config) {
        return { statusCode: 404, body: { error: 'Configuration not found', code: ErrorCode.ConfigNotFound } };
      }

      if (config.status === ConfigStatus.Disabled && !includeDisabled) {
        return { statusCode: 404, body: { error: 'Configuration not found', code: ErrorCode.ConfigNotFound } };
      }

      return { statusCode: 200, body: config };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to get config', code: ErrorCode.InternalError, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.InternalError } };
    } finally {
      endTimer();
    }
  };
}
