import { ErrorCode, MetricEvent, ConfigStatus } from 'pokey-common';
import type { Config, BulkGetConfigsRequest, BulkGetConfigsResponse } from 'pokey-common';
import { CONFIGURATIONS_TABLE } from '../../constants';
import type { HandlerDependencies, Handler } from '../../adapters/types';

const MAX_BULK_IDS = 25;

function isValidRequest(body: unknown): body is BulkGetConfigsRequest {
  if (typeof body !== 'object' || body === null) return false;
  const candidate = body as Record<string, unknown>;
  if (!Array.isArray(candidate['ids'])) return false;
  return candidate['ids'].every((id: unknown) => typeof id === 'string');
}

export function createConfigBulkGetHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.CONFIG_BULK_GET);
    try {
      deps.observability.trackEvent(MetricEvent.CONFIG_BULK_GET);

      if (!isValidRequest(request.body)) {
        return { statusCode: 400, body: { error: 'Request body must contain an "ids" array of strings', code: ErrorCode.BAD_REQUEST } };
      }

      const { ids } = request.body;

      if (ids.length === 0) {
        return { statusCode: 400, body: { error: 'ids array must not be empty', code: ErrorCode.BAD_REQUEST } };
      }

      if (ids.length > MAX_BULK_IDS) {
        return {
          statusCode: 400,
          body: { error: `ids array must not exceed ${String(MAX_BULK_IDS)} items`, code: ErrorCode.BAD_REQUEST },
        };
      }

      const uniqueIds = [...new Set(ids)];
      const includeDisabled = request.queryParameters['includeDisabled'] === 'true';

      const allConfigs = await deps.dataLayer.batchGet<Config>(
        CONFIGURATIONS_TABLE,
        uniqueIds.map((id) => ({ id })),
      );

      const configs = includeDisabled ? allConfigs : allConfigs.filter((c) => c.status !== ConfigStatus.DISABLED);

      const returnedIdSet = new Set(configs.map((c) => c.id));
      const idsNotFound = uniqueIds.filter((id) => !returnedIdSet.has(id));

      const responseBody: BulkGetConfigsResponse = { configs, idsNotFound };
      return { statusCode: 200, body: responseBody };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to bulk get configs', code: ErrorCode.INTERNAL_ERROR, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR } };
    } finally {
      endTimer();
    }
  };
}
