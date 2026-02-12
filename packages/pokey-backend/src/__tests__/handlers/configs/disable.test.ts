import { describe, it, expect, beforeEach } from 'vitest';
import { createConfigDisableHandler } from '../../../handlers/configs/disable';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { ConfigStatus } from 'pokey-common';
import type { Config } from 'pokey-common';

describe('config-disable handler', () => {
  let deps: MockDependencies;
  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns 404 when config does not exist', async () => {
    deps.dataLayer.get.mockResolvedValue(undefined);
    const handler = createConfigDisableHandler(deps);
    const res = await handler({ pathParameters: { id: 'missing' }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(404);
  });

  it('disables an existing config', async () => {
    const config: Config = {
      id: 'c1',
      name: 'test',
      schemaId: 's1',
      status: ConfigStatus.Active,
      configData: {},
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    deps.dataLayer.get.mockResolvedValue(config);
    const handler = createConfigDisableHandler(deps);
    const res = await handler({ pathParameters: { id: 'c1' }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body['status']).toBe(ConfigStatus.Disabled);
  });
});
