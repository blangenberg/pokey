import type { DataLayer } from '../abstractions/data-layer';
import type { Observability } from '../abstractions/observability';
import type { DateTimeHelper } from '../abstractions/datetime-helper';
import type { UuidHelper } from '../abstractions/uuid-helper';

export interface HandlerRequest {
  pathParameters: Record<string, string | undefined>;
  queryParameters: Record<string, string | undefined>;
  body: unknown;
}

export interface HandlerResponse {
  statusCode: number;
  body: unknown;
}

export type Handler = (request: HandlerRequest) => Promise<HandlerResponse>;

export interface HandlerDependencies {
  dataLayer: DataLayer;
  observability: Observability;
  dateTime: DateTimeHelper;
  uuid: UuidHelper;
}

export type HandlerFactory = (deps: HandlerDependencies) => Handler;
