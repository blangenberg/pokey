import { describe, it, expect, beforeEach } from 'vitest';
import { createConfigGetHandler } from '../../../handlers/config-handlers/get';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { ConfigStatus } from 'pokey-common';
import type { Config } from 'pokey-common';

const CONFIG_ID = 'bb000000-b000-4000-8000-b00000000001';
const SCHEMA_ID = 'cc000000-c000-4000-8000-c00000000001';
const MISSING_ID = 'bb000000-b000-4000-8000-b00000000401';

const activeConfig: Config = {
  id: CONFIG_ID,
  name: 'test-config',
  schemaId: SCHEMA_ID,
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
    const res = await handler({ pathParameters: { id: MISSING_ID }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(404);
  });

  it('returns 404 for disabled config when includeDisabled is false', async () => {
    deps.dataLayer.get.mockResolvedValue({ ...activeConfig, status: ConfigStatus.DISABLED });
    const handler = createConfigGetHandler(deps);
    const res = await handler({ pathParameters: { id: CONFIG_ID }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(404);
  });

  it('returns disabled config when includeDisabled is true', async () => {
    const disabled = { ...activeConfig, status: ConfigStatus.DISABLED };
    deps.dataLayer.get.mockResolvedValue(disabled);
    const handler = createConfigGetHandler(deps);
    const res = await handler({ pathParameters: { id: CONFIG_ID }, queryParameters: { includeDisabled: 'true' }, body: undefined });
    expect(res.statusCode).toBe(200);
  });

  it('returns 200 with config when found', async () => {
    deps.dataLayer.get.mockResolvedValue(activeConfig);
    const handler = createConfigGetHandler(deps);
    const res = await handler({ pathParameters: { id: CONFIG_ID }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(activeConfig);
  });
});
