import { ErrorCode, MetricEvent, ConfigStatus } from 'pokey-common';
import type { Config } from 'pokey-common';
import { CONFIGURATIONS_TABLE } from '../../constants';
import type { HandlerDependencies, Handler } from '../../adapters/types';

export function createConfigGetHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.CONFIG_GET);
    try {
      deps.observability.trackEvent(MetricEvent.CONFIG_GET);

      const id = request.pathParameters['id'];
      if (!id) {
        return { statusCode: 400, body: { error: 'Missing path parameter: id', code: ErrorCode.BAD_REQUEST } };
      }

      const includeDisabled = request.queryParameters['includeDisabled'] === 'true';

      const config = await deps.dataLayer.get<Config>(CONFIGURATIONS_TABLE, { id });
      if (!config) {
        return { statusCode: 404, body: { error: 'Configuration not found', code: ErrorCode.CONFIG_NOT_FOUND } };
      }

      if (config.status === ConfigStatus.DISABLED && !includeDisabled) {
        return { statusCode: 404, body: { error: 'Configuration not found', code: ErrorCode.CONFIG_NOT_FOUND } };
      }

      return { statusCode: 200, body: config };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to get config', code: ErrorCode.INTERNAL_ERROR, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR } };
    } finally {
      endTimer();
    }
  };
}
