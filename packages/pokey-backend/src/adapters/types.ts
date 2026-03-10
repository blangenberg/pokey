import type { DataLayer } from '../data-layer';
import type { Observability } from '../observability';
import type { DateTimeUtil, UuidUtil } from 'pokey-common';

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
