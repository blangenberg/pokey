import { ErrorCode, MetricEvent, SchemaStatus } from 'pokey-common';
import type { SchemaListItem } from 'pokey-common';
import { SCHEMAS_TABLE, MAX_PAGE_LIMIT } from '../../constants';
import { decodeNextToken, encodeNextToken } from '../../helpers/pagination';
import type { HandlerDependencies, Handler } from '../../adapters/types';

const LIST_PROJECTION = 'id, #n, #s, createdAt, updatedAt';

export function createSchemaListHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.SchemaList);
    try {
      deps.observability.trackEvent(MetricEvent.SchemaList);

      const rawLimit = Number(request.queryParameters['limit'] ?? '20');
      const limit = Math.min(Math.max(1, rawLimit), MAX_PAGE_LIMIT);
      const nextToken = request.queryParameters['nextToken'];
      const statusFilter = request.queryParameters['status'] as SchemaStatus | undefined;
      const exclusiveStartKey = decodeNextToken(nextToken);

      if (statusFilter && !Object.values(SchemaStatus).includes(statusFilter)) {
        return { statusCode: 400, body: { error: 'Invalid status filter', code: ErrorCode.BadRequest } };
      }

      let items: SchemaListItem[];
      let lastEvaluatedKey: Record<string, unknown> | undefined;

      if (statusFilter) {
        // Use the status GSI for filtered queries
        const result = await deps.dataLayer.query<SchemaListItem>({
          tableName: SCHEMAS_TABLE,
          indexName: 'schemas-status-index',
          keyConditionExpression: '#s = :status',
          expressionAttributeNames: { '#s': 'status', '#n': 'name' },
          expressionAttributeValues: { ':status': statusFilter },
          projectionExpression: LIST_PROJECTION,
          limit,
          exclusiveStartKey,
        });
        items = result.items;
        lastEvaluatedKey = result.lastEvaluatedKey;
      } else {
        // Full table scan when no status filter
        const result = await deps.dataLayer.scan<SchemaListItem>({
          tableName: SCHEMAS_TABLE,
          projectionExpression: LIST_PROJECTION,
          expressionAttributeNames: { '#n': 'name', '#s': 'status' },
          limit,
          exclusiveStartKey,
        });
        items = result.items;
        lastEvaluatedKey = result.lastEvaluatedKey;
      }

      return {
        statusCode: 200,
        body: {
          items,
          ...(lastEvaluatedKey ? { nextToken: encodeNextToken(lastEvaluatedKey) } : {}),
        },
      };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to list schemas', code: ErrorCode.InternalError, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.InternalError } };
    } finally {
      endTimer();
    }
  };
}
