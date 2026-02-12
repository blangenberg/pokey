import { vi } from 'vitest';
import type { HandlerDependencies } from '../../adapters/types';
import type { DataLayer } from '../../abstractions/data-layer';
import type { Observability } from '../../abstractions/observability';
import type { DateTimeHelper } from '../../abstractions/datetime-helper';
import type { UuidHelper } from '../../abstractions/uuid-helper';

export interface MockDependencies extends HandlerDependencies {
  dataLayer: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
    scan: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  } & DataLayer;
  observability: {
    trackEvent: ReturnType<typeof vi.fn>;
    trackError: ReturnType<typeof vi.fn>;
    startTimer: ReturnType<typeof vi.fn>;
    logError: ReturnType<typeof vi.fn>;
    getRegistry: ReturnType<typeof vi.fn>;
  } & Observability;
  dateTime: { now: ReturnType<typeof vi.fn> } & DateTimeHelper;
  uuid: { generate: ReturnType<typeof vi.fn> } & UuidHelper;
}

export function createMockDependencies(): MockDependencies {
  return {
    dataLayer: {
      get: vi.fn(),
      put: vi.fn(),
      query: vi.fn().mockResolvedValue({ items: [], lastEvaluatedKey: undefined }),
      scan: vi.fn().mockResolvedValue({ items: [], lastEvaluatedKey: undefined }),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as MockDependencies['dataLayer'],
    observability: {
      trackEvent: vi.fn(),
      trackError: vi.fn(),
      startTimer: vi.fn(() => vi.fn()),
      logError: vi.fn(),
      getRegistry: vi.fn(),
    } as unknown as MockDependencies['observability'],
    dateTime: {
      now: vi.fn(() => '2026-01-15T12:00:00.000Z'),
    } as unknown as MockDependencies['dateTime'],
    uuid: {
      generate: vi.fn(() => 'test-uuid-0001'),
    } as unknown as MockDependencies['uuid'],
  };
}
