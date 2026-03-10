import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startContainer, stopContainer, createRealDependencies } from './setup';
import { createSchemaCreateHandler } from '../../handlers/schema-handlers/create';
import { createSchemaGetHandler } from '../../handlers/schema-handlers/get';
import { createSchemaListHandler } from '../../handlers/schema-handlers/list';
import { createSchemaUpdateHandler } from '../../handlers/schema-handlers/update';
import { createSchemaDisableHandler } from '../../handlers/schema-handlers/disable';
import { createSchemaActivateHandler } from '../../handlers/schema-handlers/activate';
import { createConfigCreateHandler } from '../../handlers/config-handlers/create';
import type { HandlerDependencies } from '../../adapters/types';
import { ErrorCode } from 'pokey-common';
import type { Schema } from 'pokey-common';

let deps: HandlerDependencies;

const BASE_SCHEMA_DATA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    theme: { type: 'string' },
  },
  required: ['title', 'theme'],
};

beforeAll(async () => {
  await startContainer();
  deps = createRealDependencies();
}, 30_000);

afterAll(async () => {
  await stopContainer();
});

describe('schema lifecycle (functional)', () => {
  let schemaId: string;

  it('creates a schema and retrieves it by ID', async () => {
    const create = createSchemaCreateHandler(deps);
    const createRes = await create({
      pathParameters: {},
      queryParameters: {},
      body: { name: 'FunctionalTestSchema', schemaData: BASE_SCHEMA_DATA },
    });

    expect(createRes.statusCode).toBe(200);
    const created = createRes.body as Schema;
    expect(created.name).toBe('functionaltestschema');
    expect(created.status).toBe('active');
    schemaId = created.id;

    const get = createSchemaGetHandler(deps);
    const getRes = await get({
      pathParameters: { id: schemaId },
      queryParameters: {},
      body: undefined,
    });

    expect(getRes.statusCode).toBe(200);
    const fetched = getRes.body as Schema;
    expect(fetched.id).toBe(schemaId);
    expect(fetched.name).toBe('functionaltestschema');
  });

  it('lists schemas filtered by active status', async () => {
    const list = createSchemaListHandler(deps);
    const res = await list({
      pathParameters: {},
      queryParameters: { status: 'active' },
      body: undefined,
    });

    expect(res.statusCode).toBe(200);
    const body = res.body as { items: Schema[] };
    const found = body.items.some((s) => s.id === schemaId);
    expect(found).toBe(true);
  });

  it('rejects a duplicate schema name with 409', async () => {
    const create = createSchemaCreateHandler(deps);
    const res = await create({
      pathParameters: {},
      queryParameters: {},
      body: { name: 'FunctionalTestSchema', schemaData: BASE_SCHEMA_DATA },
    });

    expect(res.statusCode).toBe(409);
  });

  it('updates a schema with a backward-compatible change', async () => {
    const update = createSchemaUpdateHandler(deps);
    const res = await update({
      pathParameters: { id: schemaId },
      queryParameters: {},
      body: {
        schemaData: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            theme: { type: 'string' },
            subtitle: { type: 'string' },
          },
          required: ['title', 'theme'],
        },
      },
    });

    expect(res.statusCode).toBe(200);
    const updated = res.body as Schema;
    expect(updated.schemaData).toHaveProperty('properties.subtitle');
  });

  it('rejects a backward-incompatible schema update when configs exist', async () => {
    const createConfig = createConfigCreateHandler(deps);
    await createConfig({
      pathParameters: {},
      queryParameters: {},
      body: {
        name: 'CompatibilityTestConfig',
        schemaId,
        configData: { title: 'Test', theme: 'dark' },
      },
    });

    const update = createSchemaUpdateHandler(deps);
    const res = await update({
      pathParameters: { id: schemaId },
      queryParameters: {},
      body: {
        schemaData: {
          type: 'object',
          properties: {
            title: { type: 'number' },
          },
          required: ['title'],
        },
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.body as Record<string, unknown>;
    expect(body['code']).toBe(ErrorCode.SCHEMA_INCOMPATIBLE);
  });

  it('disables a schema and excludes it from active list', async () => {
    const disable = createSchemaDisableHandler(deps);
    const disableRes = await disable({
      pathParameters: { id: schemaId },
      queryParameters: {},
      body: undefined,
    });

    expect(disableRes.statusCode).toBe(200);

    const list = createSchemaListHandler(deps);
    const listRes = await list({
      pathParameters: {},
      queryParameters: { status: 'active' },
      body: undefined,
    });

    const body = listRes.body as { items: Schema[] };
    const found = body.items.some((s) => s.id === schemaId);
    expect(found).toBe(false);
  });

  it('re-activates a disabled schema', async () => {
    const activate = createSchemaActivateHandler(deps);
    const res = await activate({
      pathParameters: { id: schemaId },
      queryParameters: {},
      body: undefined,
    });

    expect(res.statusCode).toBe(200);
    const schema = res.body as Schema;
    expect(schema.status).toBe('active');
  });
});
