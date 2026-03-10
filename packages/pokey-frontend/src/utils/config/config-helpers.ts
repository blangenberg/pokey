import Ajv from 'ajv';

type JsonSchema = Record<string, unknown>;

export function buildDefaults(schema: JsonSchema): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;

  for (const [key, propSchema] of Object.entries(properties)) {
    if (propSchema.default !== undefined) {
      result[key] = propSchema.default;
    } else if (propSchema.type === 'boolean') {
      result[key] = false;
    } else if (propSchema.type === 'object') {
      result[key] = buildDefaults(propSchema);
    } else if (propSchema.type === 'array') {
      result[key] = [];
    }
  }

  return result;
}

interface AjvError {
  instancePath?: string;
  dataPath?: string;
  keyword?: string;
  message?: string;
  params?: Record<string, unknown>;
}

function getErrorPath(err: AjvError): string {
  const raw = err.instancePath ?? err.dataPath ?? '/';
  let path: string;
  if (raw.startsWith('.')) {
    path =
      '/' +
      raw
        .slice(1)
        .replace(/\./g, '/')
        .replace(/\[(\d+)]/g, '/$1');
  } else {
    path = raw || '/';
  }

  if (err.keyword === 'required' && typeof err.params?.missingProperty === 'string') {
    const parent = path === '/' ? '' : path;
    return `${parent}/${err.params.missingProperty}`;
  }

  return path;
}

function stripEmptyStrings(schema: JsonSchema, data: Record<string, unknown>): Record<string, unknown> {
  const required = new Set((schema.required ?? []) as string[]);
  const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (required.has(key) && value === '') {
      continue;
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && properties[key]?.type === 'object') {
      cleaned[key] = stripEmptyStrings(properties[key], value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

export function validateConfigData(schema: JsonSchema, data: Record<string, unknown>): Map<string, string> {
  const errorMap = new Map<string, string>();
  const ajv = new Ajv({ allErrors: true, strict: false });
  const cleanedData = stripEmptyStrings(schema, data);

  try {
    const validate = ajv.compile(schema);
    const isValid = validate(cleanedData);

    if (!isValid && validate.errors) {
      for (const err of validate.errors) {
        const fieldPath = getErrorPath(err as AjvError);
        const message = typeof err.message === 'string' ? err.message : 'Invalid value';
        errorMap.set(fieldPath, message);
      }
    }
  } catch {
    errorMap.set('/', 'Schema compilation failed');
  }

  return errorMap;
}
