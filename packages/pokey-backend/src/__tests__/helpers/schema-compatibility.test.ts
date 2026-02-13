import { describe, it, expect } from 'vitest';
import { checkSchemaCompatibility } from '../../utils/schema-compatibility';

describe('checkSchemaCompatibility', () => {
  it('returns no issues when schemas are identical', () => {
    const schema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    };
    expect(checkSchemaCompatibility(schema, schema)).toEqual([]);
  });

  it('allows adding new optional properties', () => {
    const old = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] };
    const updated = { type: 'object', properties: { a: { type: 'string' }, b: { type: 'number' } }, required: ['a'] };
    expect(checkSchemaCompatibility(old, updated)).toEqual([]);
  });

  it('allows making a required property optional', () => {
    const old = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] };
    const updated = { type: 'object', properties: { a: { type: 'string' } }, required: [] };
    expect(checkSchemaCompatibility(old, updated)).toEqual([]);
  });

  it('allows removing an optional property', () => {
    const old = { type: 'object', properties: { a: { type: 'string' }, b: { type: 'number' } }, required: ['a'] };
    const updated = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] };
    expect(checkSchemaCompatibility(old, updated)).toEqual([]);
  });

  it('flags making an optional property required', () => {
    const old = { type: 'object', properties: { a: { type: 'string' } }, required: [] };
    const updated = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] };
    const issues = checkSchemaCompatibility(old, updated);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe('REQUIRED_ADDED');
    expect(issues[0]?.path).toBe('a');
  });

  it('flags removing a required property', () => {
    const old = { type: 'object', properties: { a: { type: 'string' }, b: { type: 'number' } }, required: ['a', 'b'] };
    const updated = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] };
    const issues = checkSchemaCompatibility(old, updated);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe('REQUIRED_REMOVED');
    expect(issues[0]?.path).toBe('b');
  });

  it('flags changing a property type', () => {
    const old = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] };
    const updated = { type: 'object', properties: { a: { type: 'number' } }, required: ['a'] };
    const issues = checkSchemaCompatibility(old, updated);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe('TYPE_CHANGED');
  });

  it('flags adding a brand-new required property', () => {
    const old = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] };
    const updated = { type: 'object', properties: { a: { type: 'string' }, b: { type: 'number' } }, required: ['a', 'b'] };
    const issues = checkSchemaCompatibility(old, updated);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe('REQUIRED_ADDED');
    expect(issues[0]?.path).toBe('b');
  });

  it('checks nested object schemas recursively', () => {
    const old = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: { street: { type: 'string' }, zip: { type: 'string' } },
          required: ['street'],
        },
      },
      required: ['address'],
    };
    const updated = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: { street: { type: 'number' }, zip: { type: 'string' } },
          required: ['street'],
        },
      },
      required: ['address'],
    };
    const issues = checkSchemaCompatibility(old, updated);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe('TYPE_CHANGED');
    expect(issues[0]?.path).toBe('address.street');
  });

  it('detects multiple issues at once', () => {
    const old = {
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' } },
      required: ['a', 'b'],
    };
    const updated = {
      type: 'object',
      properties: { a: { type: 'number' }, c: { type: 'boolean' } },
      required: ['a', 'c'],
    };
    const issues = checkSchemaCompatibility(old, updated);
    // a: type changed; b: required removed; c: optional made required
    expect(issues.length).toBeGreaterThanOrEqual(3);
  });
});
