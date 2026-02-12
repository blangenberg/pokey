export enum ErrorCode {
  // Schema errors
  SchemaNotFound = 'SCHEMA_NOT_FOUND',
  SchemaNameConflict = 'SCHEMA_NAME_CONFLICT',
  SchemaInvalid = 'SCHEMA_INVALID',
  SchemaIncompatible = 'SCHEMA_INCOMPATIBLE',
  SchemaDisabled = 'SCHEMA_DISABLED',

  // Config errors
  ConfigNotFound = 'CONFIG_NOT_FOUND',
  ConfigNameConflict = 'CONFIG_NAME_CONFLICT',
  ConfigDataInvalid = 'CONFIG_DATA_INVALID',

  // General errors
  BadRequest = 'BAD_REQUEST',
  InternalError = 'INTERNAL_ERROR',
}

export enum MetricEvent {
  // Schema events
  SchemaGet = 'schema_get',
  SchemaList = 'schema_list',
  SchemaCreate = 'schema_create',
  SchemaUpdate = 'schema_update',
  SchemaDisable = 'schema_disable',
  SchemaActivate = 'schema_activate',

  // Config events
  ConfigGet = 'config_get',
  ConfigList = 'config_list',
  ConfigCreate = 'config_create',
  ConfigUpdate = 'config_update',
  ConfigDisable = 'config_disable',
  ConfigActivate = 'config_activate',
}
