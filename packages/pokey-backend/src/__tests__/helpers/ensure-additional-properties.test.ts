import { describe, it, expect } from 'vitest';
import { ensureAdditionalProperties } from '../../utils/ensure-additional-properties';

describe('ensureAdditionalProperties', () => {
  it('adds additionalProperties: true to a flat schema', () => {
    const schema = { type: 'object', properties: { a: { type: 'string' } } };
    const result = ensureAdditionalProperties(schema);
    expect(result['additionalProperties']).toBe(true);
  });

  it('recursively processes nested object properties', () => {
    const schema = {
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          properties: { b: { type: 'number' } },
        },
      },
    };
    const result = ensureAdditionalProperties(schema);
    const props = result['properties'] as Record<string, Record<string, unknown>>;
    const nested = props['nested'];
    expect(nested?.['additionalProperties']).toBe(true);
  });

  it('does not modify non-object properties', () => {
    const schema = {
      type: 'object',
      properties: { name: { type: 'string', minLength: 1 } },
    };
    const result = ensureAdditionalProperties(schema);
    const props = result['properties'] as Record<string, Record<string, unknown>>;
    const name = props['name'];
    expect(name?.['additionalProperties']).toBeUndefined();
    expect(name?.['minLength']).toBe(1);
  });
});
