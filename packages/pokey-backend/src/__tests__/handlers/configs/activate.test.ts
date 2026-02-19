import { describe, it, expect, beforeEach } from 'vitest';
import { createConfigActivateHandler } from '../../../handlers/config-handlers/activate';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { ConfigStatus } from 'pokey-common';
import type { Config } from 'pokey-common';

const CONFIG_ID = 'bb000000-b000-4000-8000-b00000000050';
const SCHEMA_ID = 'cc000000-c000-4000-8000-c00000000050';
const MISSING_ID = 'bb000000-b000-4000-8000-b00000000551';

describe('config-activate handler', () => {
  let deps: MockDependencies;
  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns 404 when config does not exist', async () => {
    deps.dataLayer.get.mockResolvedValue(undefined);
    const handler = createConfigActivateHandler(deps);
    const res = await handler({ pathParameters: { id: MISSING_ID }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(404);
  });

  it('activates a disabled config', async () => {
    const config: Config = {
      id: CONFIG_ID,
      name: 'test',
      schemaId: SCHEMA_ID,
      status: ConfigStatus.DISABLED,
      configData: {},
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    deps.dataLayer.get.mockResolvedValue(config);
    const handler = createConfigActivateHandler(deps);
    const res = await handler({ pathParameters: { id: CONFIG_ID }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as Config;
    expect(body.status).toBe(ConfigStatus.ACTIVE);
  });
});
