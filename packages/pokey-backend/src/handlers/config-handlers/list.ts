import { ErrorCode, MetricEvent, ConfigStatus } from 'pokey-common';
import type { ConfigListItem } from 'pokey-common';
import { CONFIGURATIONS_TABLE, MAX_PAGE_LIMIT, MIN_SEARCH_LENGTH } from '../../constants';
import { decodeNextToken, encodeNextToken } from '../../utils/pagination';
import { buildListFilter } from '../../utils/build-list-filter';
import type { HandlerDependencies, Handler } from '../../adapters/types';

const LIST_PROJECTION = 'id, #n, schemaId, #s, createdAt, updatedAt';

export function createConfigListHandler(deps: HandlerDependencies): Handler {
  return async (request) => {
    const endTimer = deps.observability.startTimer(MetricEvent.CONFIG_LIST);
    try {
      deps.observability.trackEvent(MetricEvent.CONFIG_LIST);

      const rawLimit = Number(request.queryParameters['limit'] ?? '20');
      const limit = Math.min(Math.max(1, rawLimit), MAX_PAGE_LIMIT);
      const nextToken = request.queryParameters['nextToken'];
      const statusFilter = request.queryParameters['status'] as ConfigStatus | undefined;
      const schemaIdFilter = request.queryParameters['schemaId'];
      const nameFilter = request.queryParameters['name'];
      const idFilter = request.queryParameters['id'];
      const exclusiveStartKey = decodeNextToken(nextToken);

      if (statusFilter && !Object.values(ConfigStatus).includes(statusFilter)) {
        return { statusCode: 400, body: { error: 'Invalid status filter', code: ErrorCode.BAD_REQUEST } };
      }

      const nameTooShort = nameFilter !== undefined && nameFilter.length < MIN_SEARCH_LENGTH;
      const idTooShort = idFilter !== undefined && idFilter.length < MIN_SEARCH_LENGTH;
      if (nameTooShort || idTooShort) {
        return { statusCode: 200, body: { items: [] } };
      }

      const hasSubstringFilters = Boolean(nameFilter) || Boolean(idFilter);
      let items: ConfigListItem[];
      let lastEvaluatedKey: Record<string, unknown> | undefined;

      if (!hasSubstringFilters && schemaIdFilter) {
        const expressionAttributeNames: Record<string, string> = { '#n': 'name', '#s': 'status' };
        const expressionAttributeValues: Record<string, unknown> = { ':schemaId': schemaIdFilter };
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
          scanIndexForward: false,
          limit,
          exclusiveStartKey,
        });
        items = result.items;
        lastEvaluatedKey = result.lastEvaluatedKey;
      } else if (hasSubstringFilters) {
        const filter = buildListFilter({ name: nameFilter, id: idFilter, status: statusFilter, schemaId: schemaIdFilter });
        const result = await deps.dataLayer.scan<ConfigListItem>({
          tableName: CONFIGURATIONS_TABLE,
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
        const result = await deps.dataLayer.scan<ConfigListItem>({
          tableName: CONFIGURATIONS_TABLE,
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
      deps.observability.logError({ message: 'Failed to list configs', code: ErrorCode.INTERNAL_ERROR, details: error });
      return { statusCode: 500, body: { error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR } };
    } finally {
      endTimer();
    }
  };
}
