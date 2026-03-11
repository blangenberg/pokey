import { describe, it, expect, beforeEach } from 'vitest';
import { createConfigBulkGetHandler } from '../../../handlers/config-handlers/bulk-get';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { ConfigStatus } from 'pokey-common';
import type { Config, BulkGetConfigsResponse } from 'pokey-common';

const CONFIG_ID_1 = 'bb000000-b000-4000-8000-b00000000001';
const CONFIG_ID_2 = 'bb000000-b000-4000-8000-b00000000002';
const MISSING_ID = 'bb000000-b000-4000-8000-b00000000999';
const SCHEMA_ID = 'cc000000-c000-4000-8000-c00000000001';

function makeConfig(id: string, status: ConfigStatus = ConfigStatus.ACTIVE): Config {
  return {
    id,
    name: `config-${id.slice(-3)}`,
    schemaId: SCHEMA_ID,
    status,
    configData: { key: 'value' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('config-bulk-get handler', () => {
  let deps: MockDependencies;

  beforeEach(() => {
    deps = createMockDependencies();
  });

  // ── Validation ──────────────────────────────────────────────────────────

  it('returns 400 when body is missing', async () => {
    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when body has no ids field', async () => {
    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: {}, body: { notIds: [] } });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when ids is not an array', async () => {
    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: {}, body: { ids: 'not-an-array' } });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when ids contains non-string values', async () => {
    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: {}, body: { ids: [123, 456] } });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when ids array is empty', async () => {
    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: {}, body: { ids: [] } });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when ids array exceeds 25 items', async () => {
    const ids = Array.from({ length: 26 }, (_, i) => `id-${String(i)}`);
    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: {}, body: { ids } });
    expect(res.statusCode).toBe(400);
  });

  // ── Success cases ───────────────────────────────────────────────────────

  it('returns 200 with all configs found', async () => {
    const configs = [makeConfig(CONFIG_ID_1), makeConfig(CONFIG_ID_2)];
    deps.dataLayer.batchGet.mockResolvedValue(configs);

    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { ids: [CONFIG_ID_1, CONFIG_ID_2] },
    });

    expect(res.statusCode).toBe(200);
    const body = res.body as BulkGetConfigsResponse;
    expect(body.configs).toEqual(configs);
    expect(body.idsNotFound).toEqual([]);
  });

  it('returns 200 with partial results and populates idsNotFound', async () => {
    const configs = [makeConfig(CONFIG_ID_1)];
    deps.dataLayer.batchGet.mockResolvedValue(configs);

    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { ids: [CONFIG_ID_1, MISSING_ID] },
    });

    expect(res.statusCode).toBe(200);
    const body = res.body as BulkGetConfigsResponse;
    expect(body.configs).toEqual(configs);
    expect(body.idsNotFound).toEqual([MISSING_ID]);
  });

  it('returns all ids as idsNotFound when none are found', async () => {
    deps.dataLayer.batchGet.mockResolvedValue([]);

    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { ids: [CONFIG_ID_1, CONFIG_ID_2] },
    });

    expect(res.statusCode).toBe(200);
    const body = res.body as BulkGetConfigsResponse;
    expect(body.configs).toEqual([]);
    expect(body.idsNotFound).toEqual([CONFIG_ID_1, CONFIG_ID_2]);
  });

  // ── Disabled filtering ─────────────────────────────────────────────────

  it('filters out disabled configs by default', async () => {
    const active = makeConfig(CONFIG_ID_1, ConfigStatus.ACTIVE);
    const disabled = makeConfig(CONFIG_ID_2, ConfigStatus.DISABLED);
    deps.dataLayer.batchGet.mockResolvedValue([active, disabled]);

    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { ids: [CONFIG_ID_1, CONFIG_ID_2] },
    });

    expect(res.statusCode).toBe(200);
    const body = res.body as BulkGetConfigsResponse;
    expect(body.configs).toEqual([active]);
    expect(body.idsNotFound).toEqual([CONFIG_ID_2]);
  });

  it('includes disabled configs when includeDisabled is true', async () => {
    const active = makeConfig(CONFIG_ID_1, ConfigStatus.ACTIVE);
    const disabled = makeConfig(CONFIG_ID_2, ConfigStatus.DISABLED);
    deps.dataLayer.batchGet.mockResolvedValue([active, disabled]);

    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: { includeDisabled: 'true' },
      body: { ids: [CONFIG_ID_1, CONFIG_ID_2] },
    });

    expect(res.statusCode).toBe(200);
    const body = res.body as BulkGetConfigsResponse;
    expect(body.configs).toEqual([active, disabled]);
    expect(body.idsNotFound).toEqual([]);
  });

  // ── Deduplication ──────────────────────────────────────────────────────

  it('deduplicates ids before querying', async () => {
    const config = makeConfig(CONFIG_ID_1);
    deps.dataLayer.batchGet.mockResolvedValue([config]);

    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { ids: [CONFIG_ID_1, CONFIG_ID_1, CONFIG_ID_1] },
    });

    expect(res.statusCode).toBe(200);
    expect(deps.dataLayer.batchGet).toHaveBeenCalledWith('Configurations', [{ id: CONFIG_ID_1 }]);
    const body = res.body as BulkGetConfigsResponse;
    expect(body.configs).toEqual([config]);
    expect(body.idsNotFound).toEqual([]);
  });

  // ── Error handling ─────────────────────────────────────────────────────

  it('returns 500 when dataLayer throws', async () => {
    deps.dataLayer.batchGet.mockRejectedValue(new Error('DynamoDB failure'));

    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { ids: [CONFIG_ID_1] },
    });

    expect(res.statusCode).toBe(500);
  });

  // ── Edge case: exactly 25 IDs ──────────────────────────────────────────

  it('accepts exactly 25 ids', async () => {
    const ids = Array.from({ length: 25 }, (_, i) => `bb000000-b000-4000-8000-b000000${String(i).padStart(5, '0')}`);
    const configs = ids.map((id) => makeConfig(id));
    deps.dataLayer.batchGet.mockResolvedValue(configs);

    const handler = createConfigBulkGetHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { ids },
    });

    expect(res.statusCode).toBe(200);
    const body = res.body as BulkGetConfigsResponse;
    expect(body.configs).toHaveLength(25);
    expect(body.idsNotFound).toEqual([]);
  });
});
