import { describe, it, expect, beforeEach } from 'vitest';
import { createConfigCreateHandler } from '../../../handlers/configs/create';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { SchemaStatus, ConfigStatus } from 'pokey-common';
import type { Schema } from 'pokey-common';

const activeSchema: Schema = {
  id: 's1',
  name: 'test-schema',
  status: SchemaStatus.Active,
  schemaData: { type: 'object', properties: { a: { type: 'string' } }, required: ['a'], additionalProperties: true },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('config-create handler', () => {
  let deps: MockDependencies;
  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns 400 when required fields are missing', async () => {
    const handler = createConfigCreateHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: {}, body: { name: 'x' } });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when schema is not found', async () => {
    deps.dataLayer.get.mockResolvedValue(undefined);
    const handler = createConfigCreateHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { name: 'cfg', schemaId: 's1', configData: { a: 'hello' } },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 when schema is disabled', async () => {
    deps.dataLayer.get.mockResolvedValue({ ...activeSchema, status: SchemaStatus.Disabled });
    const handler = createConfigCreateHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { name: 'cfg', schemaId: 's1', configData: { a: 'hello' } },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 406 when configData does not conform to schema', async () => {
    deps.dataLayer.get.mockResolvedValue(activeSchema);
    const handler = createConfigCreateHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: {}, body: { name: 'cfg', schemaId: 's1', configData: { a: 123 } } });
    expect(res.statusCode).toBe(406);
  });

  it('returns 409 when name conflicts', async () => {
    deps.dataLayer.get.mockResolvedValue(activeSchema);
    deps.dataLayer.query.mockResolvedValue({ items: [{ id: 'existing' }], lastEvaluatedKey: undefined });
    const handler = createConfigCreateHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { name: 'taken', schemaId: 's1', configData: { a: 'hello' } },
    });
    expect(res.statusCode).toBe(409);
  });

  it('creates a config successfully', async () => {
    deps.dataLayer.get.mockResolvedValue(activeSchema);
    deps.dataLayer.query.mockResolvedValue({ items: [], lastEvaluatedKey: undefined });
    const handler = createConfigCreateHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { name: 'MyConfig', schemaId: 's1', configData: { a: 'hello' } },
    });
    expect(res.statusCode).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body['name']).toBe('myconfig');
    expect(body['status']).toBe(ConfigStatus.Active);
    expect(deps.dataLayer.put).toHaveBeenCalled();
  });
});
