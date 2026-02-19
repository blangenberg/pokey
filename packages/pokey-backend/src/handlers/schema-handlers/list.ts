import { ErrorCode, MetricEvent, SchemaStatus } from 'pokey-common';
import type { SchemaListItem } from 'pokey-common';
import { SCHEMAS_TABLE, MAX_PAGE_LIMIT, MIN_SEARCH_LENGTH } from '../../constants';
import { decodeNextToken, encodeNextToken } from '../../utils/pagination';
import { buildListFilter } from '../../utils/build-list-filter';
import type { HandlerDependencies, Handler } from '../../adapters/types';

const LIST_PROJECTION = 'id, #n, #s, createdAt, updatedAt';

export function createSchemaListHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.SCHEMA_LIST);
    try {
      deps.observability.trackEvent(MetricEvent.SCHEMA_LIST);

      const rawLimit = Number(request.queryParameters['limit'] ?? '20');
      const limit = Math.min(Math.max(1, rawLimit), MAX_PAGE_LIMIT);
      const nextToken = request.queryParameters['nextToken'];
      const statusFilter = request.queryParameters['status'] as SchemaStatus | undefined;
      const nameFilter = request.queryParameters['name'];
      const idFilter = request.queryParameters['id'];
      const exclusiveStartKey = decodeNextToken(nextToken);

      if (statusFilter && !Object.values(SchemaStatus).includes(statusFilter)) {
        return { statusCode: 400, body: { error: 'Invalid status filter', code: ErrorCode.BAD_REQUEST } };
      }

      const nameTooShort = nameFilter !== undefined && nameFilter.length < MIN_SEARCH_LENGTH;
      const idTooShort = idFilter !== undefined && idFilter.length < MIN_SEARCH_LENGTH;
      if (nameTooShort || idTooShort) {
        return { statusCode: 200, body: { items: [] } };
      }

      const hasSubstringFilters = Boolean(nameFilter) || Boolean(idFilter);
      let items: SchemaListItem[];
      let lastEvaluatedKey: Record<string, unknown> | undefined;

      if (!hasSubstringFilters && statusFilter) {
        const result = await deps.dataLayer.query<SchemaListItem>({
          tableName: SCHEMAS_TABLE,
          indexName: 'schemas-status-index',
          keyConditionExpression: '#s = :status',
          expressionAttributeNames: { '#s': 'status', '#n': 'name' },
          expressionAttributeValues: { ':status': statusFilter },
          projectionExpression: LIST_PROJECTION,
          scanIndexForward: false,
          limit,
          exclusiveStartKey,
        });
        items = result.items;
        lastEvaluatedKey = result.lastEvaluatedKey;
      } else if (hasSubstringFilters) {
        const filter = buildListFilter({ name: nameFilter, id: idFilter, status: statusFilter });
        const result = await deps.dataLayer.scan<SchemaListItem>({
          tableName: SCHEMAS_TABLE,
          projectionExpression: LIST_PROJECTION,
          expressionAttributeNames: { '#n': 'name', '#s': 'status', ...filter.expressionAttributeNames },
          expressionAttributeValues: filter.expressionAttributeValues,
          filterExpression: filter.filterExpression,
          limit,
          exclusiveStartKey,
        });
        items = result.items;
        lastEvaluatedKey = result.lastEvaluatedKey;
      } else {
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

      const seen = new Set<string>();
      const deduped = items.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      const sorted = hasSubstringFilters
        ? deduped.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : b.updatedAt < a.updatedAt ? -1 : 0))
        : deduped;

      return {
        statusCode: 200,
        body: {
          items: sorted,
          ...(lastEvaluatedKey ? { nextToken: encodeNextToken(lastEvaluatedKey) } : {}),
        },
      };
    } catch (error: unknown) {
      deps.observability.logError({ message: 'Failed to list schemas', code: ErrorCode.INTERNAL_ERROR, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR } };
    } finally {
      endTimer();
    }
  };
}
