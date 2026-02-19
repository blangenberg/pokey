import { describe, it, expect, beforeEach } from 'vitest';
import { createSchemaListHandler } from '../../../handlers/schema-handlers/list';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { SchemaStatus } from 'pokey-common';
import type { SchemaListItem, PaginatedResponse } from 'pokey-common';

const schemaListItem: SchemaListItem = {
  id: 's1',
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

  it('returns a paginated list using scan when no status filter', async () => {
    deps.dataLayer.scan.mockResolvedValue({ items: [schemaListItem], lastEvaluatedKey: undefined });
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<SchemaListItem>;
    expect(body.items).toHaveLength(1);
  });

  it('uses GSI query when status filter is provided', async () => {
    deps.dataLayer.query.mockResolvedValue({ items: [], lastEvaluatedKey: undefined });
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', status: 'active' }, body: undefined });
    expect(res.statusCode).toBe(200);
    expect(deps.dataLayer.query).toHaveBeenCalled();
  });

  it('returns 400 for invalid status filter', async () => {
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10', status: 'invalid' }, body: undefined });
    expect(res.statusCode).toBe(400);
  });
});
