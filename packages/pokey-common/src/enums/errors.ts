export enum ErrorCode {
  // Schema errors
  SCHEMA_NOT_FOUND = 'schema_not_found',
  SCHEMA_NAME_CONFLICT = 'schema_name_conflict',
  SCHEMA_INVALID = 'schema_invalid',
  SCHEMA_INCOMPATIBLE = 'schema_incompatible',
  SCHEMA_DISABLED = 'schema_disabled',

  // Config errors
  CONFIG_NOT_FOUND = 'config_not_found',
  CONFIG_NAME_CONFLICT = 'config_name_conflict',
  CONFIG_DATA_INVALID = 'config_data_invalid',

  // General errors
  BAD_REQUEST = 'bad_request',
  INTERNAL_ERROR = 'internal_error',
}

export enum MetricEvent {
  // Schema events
  SCHEMA_GET = 'schema_get',
  SCHEMA_LIST = 'schema_list',
  SCHEMA_CREATE = 'schema_create',
  SCHEMA_UPDATE = 'schema_update',
  SCHEMA_DISABLE = 'schema_disable',
  SCHEMA_ACTIVATE = 'schema_activate',

  // Config events
  CONFIG_GET = 'config_get',
  CONFIG_LIST = 'config_list',
  CONFIG_CREATE = 'config_create',
  CONFIG_UPDATE = 'config_update',
  CONFIG_DISABLE = 'config_disable',
  CONFIG_ACTIVATE = 'config_activate',
}
