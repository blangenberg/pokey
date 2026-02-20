import { describe, it, expect } from 'vitest';
import { validateSchema } from './schema-validation';

describe('validateSchema', () => {
  it('accepts a simple valid object schema', () => {
    const result = validateSchema({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('accepts an empty schema (valid by JSON Schema spec)', () => {
    const result = validateSchema({});
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('accepts a schema with required and additionalProperties', () => {
    const result = validateSchema({
      type: 'object',
      required: ['name'],
      additionalProperties: true,
      properties: { name: { type: 'string' } },
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('accepts a schema using allOf composition', () => {
    const result = validateSchema({
      allOf: [{ type: 'object', properties: { a: { type: 'string' } } }],
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('accepts a schema with enum values', () => {
    const result = validateSchema({ type: 'string', enum: ['foo', 'bar'] });
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('returns invalid for a schema with an illegal type value', () => {
    const result = validateSchema({ type: 'not-a-type' });
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
    expect(typeof result.error).toBe('string');
  });

  it('returns invalid for a schema with a malformed required field', () => {
    // required must be an array of strings, not a plain string
    const result = validateSchema({ type: 'object', required: 'name' });
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('does not throw — always returns a result', () => {
    expect(() => validateSchema({ type: 'totally-invalid' })).not.toThrow();
  });

  it('returns separate results for separate calls (no cross-contamination)', () => {
    const r1 = validateSchema({ type: 'string' });
    const r2 = validateSchema({ type: 'not-a-type' });
    expect(r1.valid).toBe(true);
    expect(r2.valid).toBe(false);
  });
});
