import { DataLayer } from './abstractions/data-layer';
import { Observability } from './abstractions/observability';
import { DateTimeHelper } from './abstractions/datetime-helper';
import { UuidHelper } from './abstractions/uuid-helper';
import { DEFAULT_REGION, LOCAL_DYNAMODB_ENDPOINT } from './constants';
import type { HandlerDependencies } from './adapters/types';

export function createDependencies(overrides?: Partial<HandlerDependencies>): HandlerDependencies {
  const endpoint = process.env['DYNAMODB_ENDPOINT'] || LOCAL_DYNAMODB_ENDPOINT;
  const region = process.env['AWS_REGION_NAME'] || DEFAULT_REGION;

  return {
    dataLayer: overrides?.dataLayer ?? new DataLayer({ region, endpoint }),
    observability: overrides?.observability ?? new Observability(),
    dateTime: overrides?.dateTime ?? new DateTimeHelper(),
    uuid: overrides?.uuid ?? new UuidHelper(),
  };
}
