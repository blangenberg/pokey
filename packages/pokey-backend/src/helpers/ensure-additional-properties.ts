/**
 * Recursively sets `additionalProperties: true` on every object-level
 * schema so that Ajv never rejects unknown fields.
 */
export function ensureAdditionalProperties(schema: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...schema, additionalProperties: true };

  const properties: unknown = result['properties'];
  if (typeof properties === 'object' && properties !== null && !Array.isArray(properties)) {
    const props = properties as Record<string, Record<string, unknown>>;
    const updated: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'object' && value['type'] === 'object') {
        updated[key] = ensureAdditionalProperties(value);
      } else {
        updated[key] = value;
      }
    }

    result['properties'] = updated;
  }

  return result;
}
