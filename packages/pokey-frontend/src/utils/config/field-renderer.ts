type JsonSchema = Record<string, unknown>;

/**
 * The type of UI control that should be rendered for a given JSON Schema property.
 */
export type FieldControlType =
  | 'enum-select' // schema has an enum — always a dropdown regardless of type
  | 'date-input' // string with format: date or date-time
  | 'textarea' // string where maxLength > 200 or fieldName contains 'description'
  | 'text-input' // plain string
  | 'numeric-input' // number or integer
  | 'boolean-switch' // boolean
  | 'object-fieldset' // nested object — rendered recursively
  | 'array-field' // array — rendered with add/remove controls
  | 'unsupported'; // fallback for unknown types

/**
 * Determines which UI control to render for a given field schema and field name.
 * This is a pure function — no rendering logic, just a decision.
 */
export function resolveFieldControl(schema: JsonSchema, fieldName: string): FieldControlType {
  const enumValues = schema.enum as unknown[] | undefined;
  if (enumValues) return 'enum-select';

  const fieldType = schema.type as string | undefined;

  if (fieldType === 'string') {
    const format = schema.format as string | undefined;
    if (format === 'date' || format === 'date-time') return 'date-input';

    const maxLength = schema.maxLength as number | undefined;
    const isLongForm = (maxLength !== undefined && maxLength > 200) || fieldName.toLowerCase().includes('description');
    return isLongForm ? 'textarea' : 'text-input';
  }

  if (fieldType === 'number' || fieldType === 'integer') return 'numeric-input';
  if (fieldType === 'boolean') return 'boolean-switch';
  if (fieldType === 'object') return 'object-fieldset';
  if (fieldType === 'array') return 'array-field';

  return 'unsupported';
}

/**
 * Returns true if a string value should use a textarea rather than an inline input.
 * Extracted so it can be tested independently.
 */
export function isLongFormString(schema: JsonSchema, fieldName: string): boolean {
  const maxLength = schema.maxLength as number | undefined;
  return (maxLength !== undefined && maxLength > 200) || fieldName.toLowerCase().includes('description');
}
