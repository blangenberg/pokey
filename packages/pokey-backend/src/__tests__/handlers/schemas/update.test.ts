import { describe, it, expect, beforeEach } from 'vitest';
import { createSchemaUpdateHandler } from '../../../handlers/schema-handlers/update';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { SchemaStatus } from 'pokey-common';
import type { Schema } from 'pokey-common';

const existingSchema: Schema = {
  id: 's1',
  name: 'existing',
  status: SchemaStatus.ACTIVE,
  schemaData: { type: 'object', properties: { a: { type: 'string' } }, required: ['a'], additionalProperties: true },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('schema-update handler', () => {
  let deps: MockDependencies;

  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns 404 when schema does not exist', async () => {
    deps.dataLayer.get.mockResolvedValue(undefined);
    const handler = createSchemaUpdateHandler(deps);
    const res = await handler({
      pathParameters: { id: 's1' },
      queryParameters: {},
      body: { schemaData: { type: 'object', properties: { a: { type: 'string' } } } },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 when update is not backward-compatible', async () => {
    deps.dataLayer.get.mockResolvedValue({ ...existingSchema });
    const handler = createSchemaUpdateHandler(deps);
    // Removing required property 'a' is unsafe
    const res = await handler({
      pathParameters: { id: 's1' },
      queryParameters: {},
      body: { schemaData: { type: 'object', properties: {}, required: [] } },
    });
    expect(res.statusCode).toBe(400);
  });

  it('allows a backward-compatible update', async () => {
    deps.dataLayer.get.mockResolvedValue({ ...existingSchema });
    const handler = createSchemaUpdateHandler(deps);
    // Adding a new optional property is safe
    const res = await handler({
      pathParameters: { id: 's1' },
      queryParameters: {},
      body: { schemaData: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'number' } }, required: ['a'] } },
    });
    expect(res.statusCode).toBe(200);
    expect(deps.dataLayer.update).toHaveBeenCalled();
  });

  it('returns 409 when name conflicts with another schema', async () => {
    deps.dataLayer.get.mockResolvedValue({ ...existingSchema });
    deps.dataLayer.query.mockResolvedValue({ items: [{ id: 'other' }], lastEvaluatedKey: undefined });
    const handler = createSchemaUpdateHandler(deps);
    const res = await handler({
      pathParameters: { id: 's1' },
      queryParameters: {},
      body: { name: 'taken', schemaData: { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] } },
    });
    expect(res.statusCode).toBe(409);
  });
});
