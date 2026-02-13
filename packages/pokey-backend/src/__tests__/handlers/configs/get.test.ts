import { describe, it, expect, beforeEach } from 'vitest';
import { createConfigGetHandler } from '../../../handlers/config-handlers/get';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { ConfigStatus } from 'pokey-common';
import type { Config } from 'pokey-common';

const activeConfig: Config = {
  id: 'c1',
  name: 'test-config',
  schemaId: 's1',
  status: ConfigStatus.ACTIVE,
  configData: { a: 'hello' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('config-get handler', () => {
  let deps: MockDependencies;
  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns 400 when id is missing', async () => {
    const handler = createConfigGetHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when config is not found', async () => {
    deps.dataLayer.get.mockResolvedValue(undefined);
    const handler = createConfigGetHandler(deps);
    const res = await handler({ pathParameters: { id: 'missing' }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(404);
  });

  it('returns 404 for disabled config when includeDisabled is false', async () => {
    deps.dataLayer.get.mockResolvedValue({ ...activeConfig, status: ConfigStatus.DISABLED });
    const handler = createConfigGetHandler(deps);
    const res = await handler({ pathParameters: { id: 'c1' }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(404);
  });

  it('returns disabled config when includeDisabled is true', async () => {
    const disabled = { ...activeConfig, status: ConfigStatus.DISABLED };
    deps.dataLayer.get.mockResolvedValue(disabled);
    const handler = createConfigGetHandler(deps);
    const res = await handler({ pathParameters: { id: 'c1' }, queryParameters: { includeDisabled: 'true' }, body: undefined });
    expect(res.statusCode).toBe(200);
  });

  it('returns 200 with config when found', async () => {
    deps.dataLayer.get.mockResolvedValue(activeConfig);
    const handler = createConfigGetHandler(deps);
    const res = await handler({ pathParameters: { id: 'c1' }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(activeConfig);
  });
});
