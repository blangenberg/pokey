import Ajv from 'ajv';

type JsonSchema = Record<string, unknown>;

export function buildDefaults(schema: JsonSchema): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;

  for (const [key, propSchema] of Object.entries(properties)) {
    if (propSchema.default !== undefined) {
      result[key] = propSchema.default;
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
  message?: string;
}

function getErrorPath(err: AjvError): string {
  const raw = err.instancePath ?? err.dataPath ?? '/';
  if (raw.startsWith('.')) {
    return (
      '/' +
      raw
        .slice(1)
        .replace(/\./g, '/')
        .replace(/\[(\d+)]/g, '/$1')
    );
  }
  return raw || '/';
}

export function validateConfigData(schema: JsonSchema, data: Record<string, unknown>): Map<string, string> {
  const errorMap = new Map<string, string>();
  const ajv = new Ajv({ allErrors: true, strict: false });

  try {
    const validate = ajv.compile(schema);
    const isValid = validate(data);

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
