import { describe, it, expect, beforeEach } from 'vitest';
import { createConfigListHandler } from '../../../handlers/config-handlers/list';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { ConfigStatus } from 'pokey-common';
import type { ConfigListItem, PaginatedResponse } from 'pokey-common';

const configListItem: ConfigListItem = {
  id: 'c1',
  name: 'test-config',
  schemaId: 's1',
  status: ConfigStatus.ACTIVE,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('config-list handler', () => {
  let deps: MockDependencies;
  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns 400 when schemaId is missing', async () => {
    const handler = createConfigListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { limit: '10' }, body: undefined });
    expect(res.statusCode).toBe(400);
  });

  it('returns paginated list for a schemaId', async () => {
    deps.dataLayer.query.mockResolvedValue({ items: [configListItem], lastEvaluatedKey: undefined });
    const handler = createConfigListHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: { schemaId: 's1', limit: '10' }, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as PaginatedResponse<ConfigListItem>;
    expect(body.items).toHaveLength(1);
  });
});
