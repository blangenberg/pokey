import { describe, it, expect } from 'vitest';
import { buildDefaults, validateConfigData } from './config-helpers';

describe('buildDefaults', () => {
  it('returns empty object for schema with no properties', () => {
    expect(buildDefaults({ type: 'object' })).toEqual({});
  });

  it('picks up explicit default values', () => {
    const schema = {
      type: 'object',
      properties: {
        theme: { type: 'string', default: 'dark' },
        count: { type: 'number', default: 42 },
        enabled: { type: 'boolean', default: true },
      },
    };

    expect(buildDefaults(schema)).toEqual({
      theme: 'dark',
      count: 42,
      enabled: true,
    });
  });

  it('initializes arrays as empty arrays', () => {
    const schema = {
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string' } },
      },
    };

    expect(buildDefaults(schema)).toEqual({ tags: [] });
  });

  it('recursively initializes nested objects', () => {
    const schema = {
      type: 'object',
      properties: {
        settings: {
          type: 'object',
          properties: {
            color: { type: 'string', default: 'blue' },
            size: { type: 'number' },
          },
        },
      },
    };

    expect(buildDefaults(schema)).toEqual({
      settings: { color: 'blue' },
    });
  });

  it('skips properties without defaults that are not objects or arrays', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
        label: { type: 'string', default: 'hello' },
      },
    };

    const result = buildDefaults(schema);
    expect(result).toEqual({ label: 'hello' });
    expect('name' in result).toBe(false);
    expect('age' in result).toBe(false);
  });

  it('handles deeply nested defaults', () => {
    const schema = {
      type: 'object',
      properties: {
        level1: {
          type: 'object',
          properties: {
            level2: {
              type: 'object',
              properties: {
                value: { type: 'string', default: 'deep' },
              },
            },
          },
        },
      },
    };

    expect(buildDefaults(schema)).toEqual({
      level1: { level2: { value: 'deep' } },
    });
  });
});

describe('validateConfigData', () => {
  it('returns empty map for valid data', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
    };

    const errors = validateConfigData(schema, { name: 'test' });
    expect(errors.size).toBe(0);
  });

  it('reports missing required fields', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
    };

    const errors = validateConfigData(schema, {});
    expect(errors.size).toBeGreaterThan(0);
  });

  it('reports type mismatches', () => {
    const schema = {
      type: 'object',
      properties: {
        count: { type: 'integer' },
      },
    };

    const errors = validateConfigData(schema, { count: 'not a number' });
    expect(errors.size).toBeGreaterThan(0);
    expect(errors.has('/count')).toBe(true);
  });

  it('reports string constraint violations', () => {
    const schema = {
      type: 'object',
      properties: {
        code: { type: 'string', minLength: 3, maxLength: 10 },
      },
    };

    const errors = validateConfigData(schema, { code: 'ab' });
    expect(errors.has('/code')).toBe(true);
  });

  it('reports numeric constraint violations', () => {
    const schema = {
      type: 'object',
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
      },
    };

    const errors = validateConfigData(schema, { score: 150 });
    expect(errors.has('/score')).toBe(true);
  });

  it('reports errors for nested objects', () => {
    const schema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            zip: { type: 'string', pattern: '^\\d{5}$' },
          },
        },
      },
    };

    const errors = validateConfigData(schema, { address: { zip: 'bad' } });
    expect(errors.has('/address/zip')).toBe(true);
  });

  it('reports errors for array item violations', () => {
    const schema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };

    const errors = validateConfigData(schema, { tags: ['ok', 123] });
    expect(errors.has('/tags/1')).toBe(true);
  });

  it('validates enum constraints', () => {
    const schema = {
      type: 'object',
      properties: {
        color: { type: 'string', enum: ['red', 'green', 'blue'] },
      },
    };

    const errorsValid = validateConfigData(schema, { color: 'red' });
    expect(errorsValid.size).toBe(0);

    const errorsInvalid = validateConfigData(schema, { color: 'purple' });
    expect(errorsInvalid.has('/color')).toBe(true);
  });

  it('handles complex schemas with multiple errors', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        age: { type: 'integer', minimum: 0 },
        email: { type: 'string', format: 'email' },
      },
      required: ['name', 'age'],
    };

    const errors = validateConfigData(schema, { name: '', age: -5 });
    expect(errors.size).toBeGreaterThanOrEqual(2);
  });
});
