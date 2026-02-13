import { describe, it, expect, beforeEach } from 'vitest';
import { createConfigActivateHandler } from '../../../handlers/config-handlers/activate';
import { createMockDependencies, type MockDependencies } from '../../helpers/mock-dependencies';
import { ConfigStatus } from 'pokey-common';
import type { Config } from 'pokey-common';

describe('config-activate handler', () => {
  let deps: MockDependencies;
  beforeEach(() => {
    deps = createMockDependencies();
  });

  it('returns 404 when config does not exist', async () => {
    deps.dataLayer.get.mockResolvedValue(undefined);
    const handler = createConfigActivateHandler(deps);
    const res = await handler({ pathParameters: { id: 'missing' }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(404);
  });

  it('activates a disabled config', async () => {
    const config: Config = {
      id: 'c1',
      name: 'test',
      schemaId: 's1',
      status: ConfigStatus.DISABLED,
      configData: {},
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    deps.dataLayer.get.mockResolvedValue(config);
    const handler = createConfigActivateHandler(deps);
    const res = await handler({ pathParameters: { id: 'c1' }, queryParameters: {}, body: undefined });
    expect(res.statusCode).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body['status']).toBe(ConfigStatus.ACTIVE);
  });
});
