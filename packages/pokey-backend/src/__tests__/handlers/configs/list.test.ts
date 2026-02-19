import { describe, it, expect, beforeEach } from 'vitest';
import { createConfigListHandler } from '../../../handlers/config-handlers/list';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { ConfigStatus } from 'pokey-common';
import type { ConfigListItem, PaginatedResponse } from 'pokey-common';

const CONFIG_ID = 'bb000000-b000-4000-8000-b00000000010';
const SCHEMA_ID = 'cc000000-c000-4000-8000-c00000000010';

const configListItem: ConfigListItem = {
  id: CONFIG_ID,
  name: 'test-config',
  schemaId: SCHEMA_ID,
  status: ConfigStatus.ACTIVE,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('config-list handler', () => {
  let deps: MockDependencies;
  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns paginated list using GSI query when schemaId-only is provided', async () => {
    deps.dataLayer.query.mockResolvedValue({ items: [configListItem], lastEvaluatedKey: undefined });
    const handler = createConfigListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { schemaId: SCHEMA_ID, limit: '10' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<ConfigListItem>;
    expect(body.items).toHaveLength(1);
    expect(deps.dataLayer.query).toHaveBeenCalled();
    expect(deps.dataLayer.scan).not.toHaveBeenCalled();
  });

  it('uses GSI query when schemaId + status are provided (no substring filters)', async () => {
    deps.dataLayer.query.mockResolvedValue({ items: [], lastEvaluatedKey: undefined });
    const handler = createConfigListHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: { schemaId: SCHEMA_ID, status: 'active', limit: '10' },
      body: undefined,
    });
    expect(res.statusCode).toBe(200);
    expect(deps.dataLayer.query).toHaveBeenCalled();
    expect(deps.dataLayer.scan).not.toHaveBeenCalled();
  });

  it('returns all configs using scan when no filters are provided', async () => {
    deps.dataLayer.scan.mockResolvedValue({ items: [configListItem], lastEvaluatedKey: undefined });
    const handler = createConfigListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<ConfigListItem>;
    expect(body.items).toHaveLength(1);
    expect(deps.dataLayer.scan).toHaveBeenCalled();
  });

  it('uses scan with FilterExpression when name filter is provided', async () => {
    deps.dataLayer.scan.mockResolvedValue({ items: [configListItem], lastEvaluatedKey: undefined });
    const handler = createConfigListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', name: 'test' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const nameCallArgs = deps.dataLayer.scan.mock.calls[0]?.[0] as { filterExpression?: string };
    expect(nameCallArgs.filterExpression).toContain('contains(#n, :nameFilter)');
  });

  it('uses scan with FilterExpression when id filter is provided', async () => {
    deps.dataLayer.scan.mockResolvedValue({ items: [configListItem], lastEvaluatedKey: undefined });
    const handler = createConfigListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', id: 'bb000000' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const idCallArgs = deps.dataLayer.scan.mock.calls[0]?.[0] as { filterExpression?: string };
    expect(idCallArgs.filterExpression).toContain('contains(id, :idFilter)');
  });

  it('falls back to scan when name + schemaId are both provided', async () => {
    deps.dataLayer.scan.mockResolvedValue({ items: [], lastEvaluatedKey: undefined });
    const handler = createConfigListHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: { limit: '10', name: 'test', schemaId: SCHEMA_ID },
      body: undefined,
    });
    expect(res.statusCode).toBe(200);
    const comboCallArgs = deps.dataLayer.scan.mock.calls[0]?.[0] as { filterExpression?: string };
    expect(comboCallArgs.filterExpression).toContain('contains(#n, :nameFilter)');
    expect(deps.dataLayer.query).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid status filter', async () => {
    const handler = createConfigListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', status: 'bogus' }, body: undefined });
    expect(res.statusCode).toBe(400);
  });

  it('returns empty items when no matches found', async () => {
    deps.dataLayer.scan.mockResolvedValue({ items: [], lastEvaluatedKey: undefined });
    const handler = createConfigListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', name: 'nonexistent' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<ConfigListItem>;
    expect(body.items).toHaveLength(0);
    expect(body.nextToken).toBeUndefined();
  });

  it('returns nextToken when more results exist', async () => {
    const lastKey = { id: { S: CONFIG_ID } };
    deps.dataLayer.scan.mockResolvedValue({ items: [configListItem], lastEvaluatedKey: lastKey });
    const handler = createConfigListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '1', name: 'test' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<ConfigListItem>;
    expect(body.nextToken).toBeDefined();
  });

  it('short-circuits with empty results when name is fewer than 3 characters', async () => {
    const handler = createConfigListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', name: 'ab' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<ConfigListItem>;
    expect(body.items).toHaveLength(0);
    expect(deps.dataLayer.scan).not.toHaveBeenCalled();
    expect(deps.dataLayer.query).not.toHaveBeenCalled();
  });

  it('short-circuits with empty results when id is fewer than 3 characters', async () => {
    const handler = createConfigListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', id: 'bb' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<ConfigListItem>;
    expect(body.items).toHaveLength(0);
    expect(deps.dataLayer.scan).not.toHaveBeenCalled();
  });
});
