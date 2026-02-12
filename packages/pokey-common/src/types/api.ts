import { SchemaStatus, ConfigStatus } from '../enums/status';
import type { JsonSchema } from './schema';

// ── Schema API ──────────────────────────────────────────────────────────────

export interface CreateSchemaRequest {
  name: string;
  schemaData: JsonSchema;
}

export interface UpdateSchemaRequest {
  name?: string;
  schemaData: JsonSchema;
}

export interface ListSchemasParams {
  limit: number;
  nextToken?: string;
  status?: SchemaStatus;
}

// ── Config API ──────────────────────────────────────────────────────────────

export interface CreateConfigRequest {
  name: string;
  schemaId: string;
  configData: Record<string, unknown>;
}

export interface UpdateConfigRequest {
  name?: string;
  schemaId: string;
  configData: Record<string, unknown>;
}

export interface ListConfigsParams {
  schemaId: string;
  limit: number;
  nextToken?: string;
  status?: ConfigStatus;
}

// ── Shared Response Types ───────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: string;
}
