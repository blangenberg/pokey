import type { DataLayer } from '../data-layer';
import type { Observability } from '../observability';
import type { DateTimeUtil } from '../utils/datetime-util';
import type { UuidUtil } from '../utils/uuid-util';

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
  dateTime: DateTimeUtil;
  uuid: UuidUtil;
}

export type HandlerFactory = (deps: HandlerDependencies) => Handler;
