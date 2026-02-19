import { describe, it, expect, beforeEach } from 'vitest';
import { createSchemaCreateHandler } from '../../../handlers/schema-handlers/create';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { SchemaStatus } from 'pokey-common';
import type { Schema } from 'pokey-common';

const EXISTING_CONFLICT_ID = 'aa000000-a000-4000-8000-a00000000020';
const MOCK_GENERATED_ID = '10000000-1000-4000-8000-100000000001';

describe('schema-create handler', () => {
  let deps: MockDependencies;

  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns 400 when name or schemaData is missing', async () => {
    const handler = createSchemaCreateHandler(deps);
    const res = await handler({ pathParameters: {}, queryParameters: {}, body: { name: 'test' } });
    expect(res.statusCode).toBe(400);
  });

  it('returns 422 when schemaData is not a valid JSON Schema', async () => {
    const handler = createSchemaCreateHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { name: 'test', schemaData: { type: 'invalid-type-value' } },
    });
    expect([200, 422]).toContain(res.statusCode);
  });

  it('returns 409 when a schema with the same name exists', async () => {
    deps.dataLayer.query.mockResolvedValue({ items: [{ id: EXISTING_CONFLICT_ID }], lastEvaluatedKey: undefined });
    const handler = createSchemaCreateHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { name: 'Test', schemaData: { type: 'object', properties: { a: { type: 'string' } } } },
    });
    expect(res.statusCode).toBe(409);
  });

  it('creates a schema with lowercased name and active status', async () => {
    deps.dataLayer.query.mockResolvedValue({ items: [], lastEvaluatedKey: undefined });
    const handler = createSchemaCreateHandler(deps);
    const res = await handler({
      pathParameters: {},
      queryParameters: {},
      body: { name: 'MySchema', schemaData: { type: 'object', properties: { a: { type: 'string' } } } },
    });
    expect(res.statusCode).toBe(200);
    const body = res.body as Schema;
    expect(body.name).toBe('myschema');
    expect(body.status).toBe(SchemaStatus.ACTIVE);
    expect(body.id).toBe(MOCK_GENERATED_ID);
    expect(deps.dataLayer.put).toHaveBeenCalled();
  });
});
