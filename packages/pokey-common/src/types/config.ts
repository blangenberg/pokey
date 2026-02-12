import { ConfigStatus } from '../enums/status';

export interface Config {
  id: string;
  name: string;
  schemaId: string;
  status: ConfigStatus;
  configData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight config item used in list responses (omits configData) */
export interface ConfigListItem {
  id: string;
  name: string;
  schemaId: string;
  status: ConfigStatus;
  createdAt: string;
  updatedAt: string;
}
