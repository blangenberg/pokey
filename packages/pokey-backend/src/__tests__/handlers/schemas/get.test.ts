import { describe, it, expect, beforeEach } from 'vitest';
import { createSchemaGetHandler } from '../../../handlers/schema-handlers/get';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { SchemaStatus } from 'pokey-common';
import type { Schema } from 'pokey-common';

const SCHEMA_ID = 'aa000000-a000-4000-8000-a00000000001';
const MISSING_ID = 'aa000000-a000-4000-8000-a00000000404';

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
    const res = await handler({ pathParameters: { id: MISSING_ID }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with the schema when found', async () => {
    const schema: Schema = {
      id: SCHEMA_ID,
      name: 'test',
      status: SchemaStatus.ACTIVE,
      schemaData: {},
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    deps.dataLayer.get.mockResolvedValue(schema);
    const handler = createSchemaGetHandler(deps);
    const res = await handler({ pathParameters: { id: SCHEMA_ID }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(schema);
  });
});
