import { describe, it, expect, beforeEach } from 'vitest';
import { createSchemaGetHandler } from '../../../handlers/schema-handlers/get';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { SchemaStatus } from 'pokey-common';
import type { Schema } from 'pokey-common';

describe('schema-get handler', () => {
  let deps: MockDependencies;

  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns 400 when id is missing', async () => {
    const handler = createSchemaGetHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when schema is not found', async () => {
    deps.dataLayer.get.mockResolvedValue(undefined);
    const handler = createSchemaGetHandler(deps);
    const res = await handler({ pathParameters: { id: 'missing' }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with the schema when found', async () => {
    const schema: Schema = {
      id: 's1',
      name: 'test',
      status: SchemaStatus.ACTIVE,
      schemaData: {},
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    deps.dataLayer.get.mockResolvedValue(schema);
    const handler = createSchemaGetHandler(deps);
    const res = await handler({ pathParameters: { id: 's1' }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(schema);
  });
});
