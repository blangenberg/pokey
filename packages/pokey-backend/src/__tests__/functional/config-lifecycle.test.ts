import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startContainer, stopContainer, createRealDependencies } from './setup';
import { createSchemaCreateHandler } from '../../handlers/schema-handlers/create';
import { createSchemaDisableHandler } from '../../handlers/schema-handlers/disable';
import { createConfigCreateHandler } from '../../handlers/config-handlers/create';
import { createConfigGetHandler } from '../../handlers/config-handlers/get';
import { createConfigListHandler } from '../../handlers/config-handlers/list';
import { createConfigUpdateHandler } from '../../handlers/config-handlers/update';
import { createConfigDisableHandler } from '../../handlers/config-handlers/disable';
import { createConfigActivateHandler } from '../../handlers/config-handlers/activate';
import type { HandlerDependencies } from '../../adapters/types';
import { ErrorCode } from 'pokey-common';
import type { Config, Schema } from 'pokey-common';

let deps: HandlerDependencies;
let schemaId: string;

const SCHEMA_DATA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    theme: { type: 'string' },
    widgets: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'theme'],
};

beforeAll(async () => {
  await startContainer();
  deps = createRealDependencies();

  const createSchema = createSchemaCreateHandler(deps);
  const res = await createSchema({
    pathParameters: {},
    queryParameters: {},
    body: { name: 'ConfigTestSchema', schemaData: SCHEMA_DATA },
  });
  schemaId = (res.body as Schema).id;
}, 30_000);

afterAll(async () => {
  await stopContainer();
});

describe('config lifecycle (functional)', () => {
  let configId: string;

  it('creates a valid config and retrieves it by ID', async () => {
    const create = createConfigCreateHandler(deps);
    const createRes = await create({
      pathParameters: {},
      queryParameters: {},
      body: {
        name: 'HomeDashboard',
        schemaId,
        configData: { title: 'Home', theme: 'dark', widgets: ['chart', 'users'] },
      },
    });

    expect(createRes.statusCode).toBe(200);
    const created = createRes.body as Config;
    expect(created.name).toBe('homedashboard');
    expect(created.status).toBe('active');
    expect(created.configData).toEqual({ title: 'Home', theme: 'dark', widgets: ['chart', 'users'] });
    configId = created.id;

    const get = createConfigGetHandler(deps);
    const getRes = await get({
      pathParameters: { id: configId },
      queryParameters: {},
      body: undefined,
    });

    expect(getRes.statusCode).toBe(200);
    const fetched = getRes.body as Config;
    expect(fetched.id).toBe(configId);
    expect(fetched.configData).toEqual({ title: 'Home', theme: 'dark', widgets: ['chart', 'users'] });
  });

  it('rejects a config that fails schema validation with 406', async () => {
    const create = createConfigCreateHandler(deps);
    const res = await create({
      pathParameters: {},
      queryParameters: {},
      body: {
        name: 'BadConfig',
        schemaId,
        configData: { title: 'Oops' },
      },
    });

    expect(res.statusCode).toBe(406);
  });

  it('updates a config with new valid data', async () => {
    const update = createConfigUpdateHandler(deps);
    const res = await update({
      pathParameters: { id: configId },
      queryParameters: {},
      body: {
        schemaId,
        configData: { title: 'Updated Home', theme: 'light', widgets: ['chart'] },
      },
    });

    expect(res.statusCode).toBe(200);
    const updated = res.body as Config;
    expect(updated.configData).toEqual({ title: 'Updated Home', theme: 'light', widgets: ['chart'] });
  });

  it('lists configs filtered by schemaId', async () => {
    const list = createConfigListHandler(deps);
    const res = await list({
      pathParameters: {},
      queryParameters: { schemaId },
      body: undefined,
    });

    expect(res.statusCode).toBe(200);
    const body = res.body as { items: Config[] };
    const found = body.items.some((c) => c.id === configId);
    expect(found).toBe(true);
  });

  it('disables and re-activates a config', async () => {
    const disable = createConfigDisableHandler(deps);
    const disableRes = await disable({
      pathParameters: { id: configId },
      queryParameters: {},
      body: undefined,
    });

    expect(disableRes.statusCode).toBe(200);
    const disabled = disableRes.body as Config;
    expect(disabled.status).toBe('disabled');

    const activate = createConfigActivateHandler(deps);
    const activateRes = await activate({
      pathParameters: { id: configId },
      queryParameters: {},
      body: undefined,
    });

    expect(activateRes.statusCode).toBe(200);
    const activated = activateRes.body as Config;
    expect(activated.status).toBe('active');
  });

  it('rejects config creation against a disabled schema', async () => {
    const disableSchema = createSchemaDisableHandler(deps);
    await disableSchema({
      pathParameters: { id: schemaId },
      queryParameters: {},
      body: undefined,
    });

    const create = createConfigCreateHandler(deps);
    const res = await create({
      pathParameters: {},
      queryParameters: {},
      body: {
        name: 'DisabledSchemaConfig',
        schemaId,
        configData: { title: 'Test', theme: 'dark' },
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.body as Record<string, unknown>;
    expect(body['code']).toBe(ErrorCode.SCHEMA_DISABLED);
  });
});
