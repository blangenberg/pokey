import { describe, it, expect, beforeEach } from 'vitest';
import { createSchemaDisableHandler } from '../../../handlers/schema-handlers/disable';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { SchemaStatus } from 'pokey-common';
import type { Schema } from 'pokey-common';

const SCHEMA_ID = 'aa000000-a000-4000-8000-a00000000040';
const MISSING_ID = 'aa000000-a000-4000-8000-a00000000441';

describe('schema-disable handler', () => {
  let deps: MockDependencies;

  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns 404 when schema does not exist', async () => {
    deps.dataLayer.get.mockResolvedValue(undefined);
    const handler = createSchemaDisableHandler(deps);
    const res = await handler({ pathParameters: { id: MISSING_ID }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(404);
  });

  it('disables an existing schema', async () => {
    const schema: Schema = {
      id: SCHEMA_ID,
      name: 'test',
      status: SchemaStatus.ACTIVE,
      schemaData: {},
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    deps.dataLayer.get.mockResolvedValue(schema);
    const handler = createSchemaDisableHandler(deps);
    const res = await handler({ pathParameters: { id: SCHEMA_ID }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as Schema;
    expect(body.status).toBe(SchemaStatus.DISABLED);
    expect(deps.dataLayer.update).toHaveBeenCalled();
  });
});
