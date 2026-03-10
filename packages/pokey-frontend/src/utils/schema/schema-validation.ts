import Ajv from 'ajv';

type JsonSchema = Record<string, unknown>;

/**
 * Result of attempting to compile and validate a JSON Schema definition itself.
 * (Not to be confused with validating config data *against* a schema — see configHelpers.ts.)
 */
export interface SchemaValidationResult {
  valid: boolean;
  error: string | null;
}

/**
 * Checks whether a JSON Schema object is a valid, Ajv-compilable draft-07 schema.
 * Returns a structured result rather than throwing, so callers can handle errors cleanly.
 */
export function validateSchema(schemaData: JsonSchema): SchemaValidationResult {
  const ajv = new Ajv({ allErrors: true, strict: false });
  try {
    ajv.compile(schemaData);
    return { valid: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown validation error.';
    return { valid: false, error: message };
  }
}
