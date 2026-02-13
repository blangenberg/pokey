import { describe, it, expect, beforeEach } from 'vitest';
import { createSchemaListHandler } from '../../../handlers/schema-handlers/list';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';

describe('schema-list handler', () => {
  let deps: MockDependencies;

  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns a paginated list using scan when no status filter', async () => {
    deps.dataLayer.scan.mockResolvedValue({ items: [{ id: 's1' }], lastEvaluatedKey: undefined });
    const handler = createSchemaListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body['items']).toHaveLength(1);
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
