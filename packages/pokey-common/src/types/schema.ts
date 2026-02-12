import { SchemaStatus } from '../enums/status';

/** A JSON Schema object that can be compiled by Ajv */
export type JsonSchema = Record<string, unknown>;

export interface Schema {
  id: string;
  name: string;
  status: SchemaStatus;
  schemaData: JsonSchema;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight schema item used in list responses (omits schemaData) */
export interface SchemaListItem {
  id: string;
  name: string;
  status: SchemaStatus;
  createdAt: string;
  updatedAt: string;
}
