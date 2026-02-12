import { ErrorCode, MetricEvent, ConfigStatus } from 'pokey-common';
import type { ConfigListItem } from 'pokey-common';
import { CONFIGURATIONS_TABLE, MAX_PAGE_LIMIT } from '../../constants';
import { decodeNextToken, encodeNextToken } from '../../helpers/pagination';
import type { HandlerDependencies, Handler } from '../../adapters/types';

const LIST_PROJECTION = 'id, #n, schemaId, #s, createdAt, updatedAt';

export function createConfigListHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.ConfigList);
    try {
      deps.observability.trackEvent(MetricEvent.ConfigList);

      const schemaId = request.queryParameters['schemaId'];
      if (!schemaId) {
        return { statusCode: 400, body: { error: 'Missing required query parameter: schemaId', code: ErrorCode.BadRequest } };
      }

      const rawLimit = Number(request.queryParameters['limit'] ?? '20');
      const limit = Math.min(Math.max(1, rawLimit), MAX_PAGE_LIMIT);
      const nextToken = request.queryParameters['nextToken'];
      const statusFilter = request.queryParameters['status'] as ConfigStatus | undefined;
      const exclusiveStartKey = decodeNextToken(nextToken);

      if (statusFilter && !Object.values(ConfigStatus).includes(statusFilter)) {
        return { statusCode: 400, body: { error: 'Invalid status filter', code: ErrorCode.BadRequest } };
      }

      // Query by schemaId using GSI, optionally filter by status
      const expressionAttributeNames: Record<string, string> = { '#n': 'name', '#s': 'status' };
      const expressionAttributeValues: Record<string, unknown> = { ':schemaId': schemaId };
      let filterExpression: string | undefined;

      if (statusFilter) {
        filterExpression = '#s = :status';
        expressionAttributeValues[':status'] = statusFilter;
      }

      const result = await deps.dataLayer.query<ConfigListItem>({
        tableName: CONFIGURATIONS_TABLE,
        indexName: 'configs-schemaId-index',
        keyConditionExpression: 'schemaId = :schemaId',
        expressionAttributeNames,
        expressionAttributeValues,
        filterExpression,
        projectionExpression: LIST_PROJECTION,
        limit,
        exclusiveStartKey,
      });

      return {
        statusCode: 200,
        body: {
          items: result.items,
          ...(result.lastEvaluatedKey ? { nextToken: encodeNextToken(result.lastEvaluatedKey) } : {}),
        },
      };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to list configs', code: ErrorCode.InternalError, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.InternalError } };
    } finally {
      endTimer();
    }
  };
}
