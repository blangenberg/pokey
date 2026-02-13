import { describe, it, expect, beforeEach } from 'vitest';
import { createConfigUpdateHandler } from '../../../handlers/config-handlers/update';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { SchemaStatus, ConfigStatus } from 'pokey-common';
import type { Schema, Config } from 'pokey-common';

const activeSchema: Schema = {
  id: 's1',
  name: 'test-schema',
  status: SchemaStatus.ACTIVE,
  schemaData: { type: 'object', properties: { a: { type: 'string' } }, required: ['a'], additionalProperties: true },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const existingConfig: Config = {
  id: 'c1',
  name: 'existing',
  schemaId: 's1',
  status: ConfigStatus.ACTIVE,
  configData: { a: 'old' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function mockGetByTable(table: string, key: Record<string, unknown>): unknown {
  if (table === 'Configurations' && key['id'] === 'c1') return existingConfig;
  if (table === 'Schemas' && key['id'] === 's1') return activeSchema;
  return undefined;
}

describe('config-update handler', () => {
  let deps: MockDependencies;
  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns 404 when config does not exist', async () => {
    deps.dataLayer.get.mockResolvedValue(undefined);
    const handler = createConfigUpdateHandler(deps);
    const res = await handler({ pathParameters: { id: 'c1' }, queryParameters: {}, body: { schemaId: 's1', configData: { a: 'new' } } });
    expect(res.statusCode).toBe(404);
  });

  it('returns 406 when configData fails schema validation', async () => {
    deps.dataLayer.get.mockImplementation((table: string, key: Record<string, unknown>) => Promise.resolve(mockGetByTable(table, key)));
    const handler = createConfigUpdateHandler(deps);
    const res = await handler({ pathParameters: { id: 'c1' }, queryParameters: {}, body: { schemaId: 's1', configData: { a: 999 } } });
    expect(res.statusCode).toBe(406);
  });

  it('updates config successfully', async () => {
    deps.dataLayer.get.mockImplementation((table: string, key: Record<string, unknown>) => Promise.resolve(mockGetByTable(table, key)));
    const handler = createConfigUpdateHandler(deps);
    const res = await handler({
      pathParameters: { id: 'c1' },
      queryParameters: {},
      body: { schemaId: 's1', configData: { a: 'updated' } },
    });
    expect(res.statusCode).toBe(200);
    expect(deps.dataLayer.update).toHaveBeenCalled();
  });
});
