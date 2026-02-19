import { describe, it, expect, beforeEach } from 'vitest';
import { createSchemaListHandler } from '../../../handlers/schema-handlers/list';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { SchemaStatus } from 'pokey-common';
import type { SchemaListItem, PaginatedResponse } from 'pokey-common';

const SCHEMA_ID = 'aa000000-a000-4000-8000-a00000000010';

const schemaListItem: SchemaListItem = {
  id: SCHEMA_ID,
  name: 'test-schema',
  status: SchemaStatus.ACTIVE,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('schema-list handler', () => {
  let deps: MockDependencies;

  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns a paginated list using scan when no filters', async () => {
    deps.dataLayer.scan.mockResolvedValue({ items: [schemaListItem], lastEvaluatedKey: undefined });
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<SchemaListItem>;
    expect(body.items).toHaveLength(1);
    expect(deps.dataLayer.scan).toHaveBeenCalled();
  });

  it('uses GSI query when status-only filter is provided', async () => {
    deps.dataLayer.query.mockResolvedValue({ items: [schemaListItem], lastEvaluatedKey: undefined });
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', status: 'active' }, body: undefined });
    expect(res.statusCode).toBe(200);
    expect(deps.dataLayer.query).toHaveBeenCalled();
    expect(deps.dataLayer.scan).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid status filter', async () => {
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', status: 'invalid' }, body: undefined });
    expect(res.statusCode).toBe(400);
  });

  it('uses scan with FilterExpression when name filter is provided', async () => {
    deps.dataLayer.scan.mockResolvedValue({ items: [schemaListItem], lastEvaluatedKey: undefined });
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', name: 'test' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const nameCallArgs = deps.dataLayer.scan.mock.calls[0]?.[0] as { filterExpression?: string };
    expect(nameCallArgs.filterExpression).toContain('contains(#n, :nameFilter)');
  });

  it('uses scan with FilterExpression when id filter is provided', async () => {
    deps.dataLayer.scan.mockResolvedValue({ items: [schemaListItem], lastEvaluatedKey: undefined });
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', id: 'aa000000' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const idCallArgs = deps.dataLayer.scan.mock.calls[0]?.[0] as { filterExpression?: string };
    expect(idCallArgs.filterExpression).toContain('contains(id, :idFilter)');
  });

  it('falls back to scan when name + status are both provided', async () => {
    deps.dataLayer.scan.mockResolvedValue({ items: [], lastEvaluatedKey: undefined });
    const handler = createSchemaListHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: { limit: '10', name: 'test', status: 'active' },
      body: undefined,
    });
    expect(res.statusCode).toBe(200);
    const comboCallArgs = deps.dataLayer.scan.mock.calls[0]?.[0] as { filterExpression?: string };
    expect(comboCallArgs.filterExpression).toContain('contains(#n, :nameFilter) AND #s = :status');
    expect(deps.dataLayer.query).not.toHaveBeenCalled();
  });

  it('returns empty items when no matches found', async () => {
    deps.dataLayer.scan.mockResolvedValue({ items: [], lastEvaluatedKey: undefined });
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', name: 'nonexistent' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<SchemaListItem>;
    expect(body.items).toHaveLength(0);
    expect(body.nextToken).toBeUndefined();
  });

  it('returns nextToken when more results exist', async () => {
    const lastKey = { id: { S: SCHEMA_ID } };
    deps.dataLayer.scan.mockResolvedValue({ items: [schemaListItem], lastEvaluatedKey: lastKey });
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '1', name: 'test' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<SchemaListItem>;
    expect(body.nextToken).toBeDefined();
  });

  it('short-circuits with empty results when name is fewer than 3 characters', async () => {
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', name: 'ab' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<SchemaListItem>;
    expect(body.items).toHaveLength(0);
    expect(deps.dataLayer.scan).not.toHaveBeenCalled();
    expect(deps.dataLayer.query).not.toHaveBeenCalled();
  });

  it('short-circuits with empty results when id is fewer than 3 characters', async () => {
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', id: 'aa' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<SchemaListItem>;
    expect(body.items).toHaveLength(0);
    expect(deps.dataLayer.scan).not.toHaveBeenCalled();
  });
});
