import { describe, it, expect } from 'vitest';
import { resolveFieldControl, isLongFormString } from './field-renderer';

describe('resolveFieldControl', () => {
  it('returns "enum-select" when schema has enum, regardless of type', () => {
    expect(resolveFieldControl({ type: 'string', enum: ['a', 'b'] }, 'status')).toBe('enum-select');
    expect(resolveFieldControl({ enum: [1, 2, 3] }, 'count')).toBe('enum-select');
  });

  it('returns "date-input" for string with format: date', () => {
    expect(resolveFieldControl({ type: 'string', format: 'date' }, 'dob')).toBe('date-input');
  });

  it('returns "date-input" for string with format: date-time', () => {
    expect(resolveFieldControl({ type: 'string', format: 'date-time' }, 'createdAt')).toBe('date-input');
  });

  it('returns "textarea" for string with maxLength > 200', () => {
    expect(resolveFieldControl({ type: 'string', maxLength: 201 }, 'notes')).toBe('textarea');
    expect(resolveFieldControl({ type: 'string', maxLength: 1000 }, 'notes')).toBe('textarea');
  });

  it('returns "text-input" for string with maxLength <= 200', () => {
    expect(resolveFieldControl({ type: 'string', maxLength: 200 }, 'code')).toBe('text-input');
    expect(resolveFieldControl({ type: 'string', maxLength: 100 }, 'name')).toBe('text-input');
  });

  it('returns "textarea" for any field whose name contains "description" (case-insensitive)', () => {
    expect(resolveFieldControl({ type: 'string' }, 'description')).toBe('textarea');
    expect(resolveFieldControl({ type: 'string' }, 'productDescription')).toBe('textarea');
    expect(resolveFieldControl({ type: 'string' }, 'DESCRIPTION')).toBe('textarea');
  });

  it('returns "text-input" for a plain string with no special attributes', () => {
    expect(resolveFieldControl({ type: 'string' }, 'name')).toBe('text-input');
  });

  it('returns "numeric-input" for number type', () => {
    expect(resolveFieldControl({ type: 'number' }, 'price')).toBe('numeric-input');
  });

  it('returns "numeric-input" for integer type', () => {
    expect(resolveFieldControl({ type: 'integer' }, 'count')).toBe('numeric-input');
  });

  it('returns "boolean-switch" for boolean type', () => {
    expect(resolveFieldControl({ type: 'boolean' }, 'enabled')).toBe('boolean-switch');
  });

  it('returns "object-fieldset" for object type', () => {
    expect(resolveFieldControl({ type: 'object', properties: {} }, 'address')).toBe('object-fieldset');
  });

  it('returns "array-field" for array type', () => {
    expect(resolveFieldControl({ type: 'array', items: { type: 'string' } }, 'tags')).toBe('array-field');
  });

  it('returns "unsupported" for an unrecognized or missing type', () => {
    expect(resolveFieldControl({}, 'unknown')).toBe('unsupported');
    expect(resolveFieldControl({ type: 'null' }, 'nothing')).toBe('unsupported');
  });
});

describe('isLongFormString', () => {
  it('returns true when maxLength > 200', () => {
    expect(isLongFormString({ maxLength: 500 }, 'bio')).toBe(true);
  });

  it('returns false when maxLength is exactly 200', () => {
    expect(isLongFormString({ maxLength: 200 }, 'bio')).toBe(false);
  });

  it('returns false when maxLength is below 200', () => {
    expect(isLongFormString({ maxLength: 100 }, 'bio')).toBe(false);
  });

  it('returns true when fieldName contains "description"', () => {
    expect(isLongFormString({}, 'description')).toBe(true);
    expect(isLongFormString({}, 'longDescription')).toBe(true);
  });

  it('returns false when fieldName does not contain "description" and no maxLength', () => {
    expect(isLongFormString({}, 'name')).toBe(false);
  });

  it('returns true when either condition is met independently', () => {
    expect(isLongFormString({ maxLength: 201 }, 'name')).toBe(true);
    expect(isLongFormString({ maxLength: 50 }, 'itemDescription')).toBe(true);
  });
});
