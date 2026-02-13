import { describe, it, expect, beforeEach } from 'vitest';
import { createSchemaActivateHandler } from '../../../handlers/schema-handlers/activate';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { SchemaStatus } from 'pokey-common';
import type { Schema } from 'pokey-common';

describe('schema-activate handler', () => {
  let deps: MockDependencies;

  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns 404 when schema does not exist', async () => {
    deps.dataLayer.get.mockResolvedValue(undefined);
    const handler = createSchemaActivateHandler(deps);
    const res = await handler({ pathParameters: { id: 'missing' }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(404);
  });

  it('activates a disabled schema', async () => {
    const schema: Schema = {
      id: 's1',
      name: 'test',
      status: SchemaStatus.DISABLED,
      schemaData: {},
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    deps.dataLayer.get.mockResolvedValue(schema);
    const handler = createSchemaActivateHandler(deps);
    const res = await handler({ pathParameters: { id: 's1' }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body['status']).toBe(SchemaStatus.ACTIVE);
    expect(deps.dataLayer.update).toHaveBeenCalled();
  });
});
