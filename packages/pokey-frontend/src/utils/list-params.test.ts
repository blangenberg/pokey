import { describe, it, expect } from 'vitest';
import { buildSchemaParams, buildConfigParams, buildFilterSearchParams } from './list-params';

// ---------------------------------------------------------------------------
// buildSchemaParams
// ---------------------------------------------------------------------------
describe('buildSchemaParams', () => {
  it('returns empty params for default filter state', () => {
    const result = buildSchemaParams({ name: '', id: '', status: 'all' });
    expect(result).toEqual({});
  });

  it('includes status when not "all"', () => {
    const result = buildSchemaParams({ name: '', id: '', status: 'active' });
    expect(result).toEqual({ status: 'active' });
  });

  it('includes nextToken when present', () => {
    const result = buildSchemaParams({ name: '', id: '', status: 'all', nextToken: 'tok123' });
    expect(result.nextToken).toBe('tok123');
  });

  it('omits name shorter than 3 characters', () => {
    const result = buildSchemaParams({ name: 'ab', id: '', status: 'all' });
    expect(result.name).toBeUndefined();
  });

  it('includes name exactly 3 characters long', () => {
    const result = buildSchemaParams({ name: 'abc', id: '', status: 'all' });
    expect(result.name).toBe('abc');
  });

  it('includes name longer than 3 characters', () => {
    const result = buildSchemaParams({ name: 'order', id: '', status: 'all' });
    expect(result.name).toBe('order');
  });

  it('omits id shorter than 3 characters', () => {
    const result = buildSchemaParams({ name: '', id: 'xz', status: 'all' });
    expect(result.id).toBeUndefined();
  });

  it('includes id at least 3 characters', () => {
    const result = buildSchemaParams({ name: '', id: 'xyz', status: 'all' });
    expect(result.id).toBe('xyz');
  });

  it('combines all params', () => {
    const result = buildSchemaParams({ name: 'order', id: 'abc123', status: 'active', nextToken: 'tok' });
    expect(result).toEqual({ name: 'order', id: 'abc123', status: 'active', nextToken: 'tok' });
  });
});

// ---------------------------------------------------------------------------
// buildConfigParams
// ---------------------------------------------------------------------------
describe('buildConfigParams', () => {
  it('returns empty params for default filter state', () => {
    const result = buildConfigParams({ name: '', id: '', status: 'all' });
    expect(result).toEqual({});
  });

  it('includes schemaId when provided', () => {
    const result = buildConfigParams({ name: '', id: '', status: 'all', schemaId: 'schema-1' });
    expect(result.schemaId).toBe('schema-1');
  });

  it('omits schemaId when undefined', () => {
    const result = buildConfigParams({ name: '', id: '', status: 'all' });
    expect(result.schemaId).toBeUndefined();
  });

  it('omits name shorter than 3 characters', () => {
    const result = buildConfigParams({ name: 'ab', id: '', status: 'all' });
    expect(result.name).toBeUndefined();
  });

  it('includes name with 3+ characters', () => {
    const result = buildConfigParams({ name: 'foo', id: '', status: 'all' });
    expect(result.name).toBe('foo');
  });

  it('combines all params', () => {
    const result = buildConfigParams({ name: 'cfg', id: 'def', status: 'disabled', schemaId: 'sid', nextToken: 'nt' });
    expect(result).toEqual({ name: 'cfg', id: 'def', status: 'disabled', schemaId: 'sid', nextToken: 'nt' });
  });
});

// ---------------------------------------------------------------------------
// buildFilterSearchParams
// ---------------------------------------------------------------------------
describe('buildFilterSearchParams', () => {
  const defaults = { status: 'all', name: '' };

  it('returns empty params when all values match defaults', () => {
    const params = buildFilterSearchParams({ status: 'all', name: '' }, defaults);
    expect(params.toString()).toBe('');
  });

  it('includes a value that differs from its default', () => {
    const params = buildFilterSearchParams({ status: 'active', name: '' }, defaults);
    expect(params.get('status')).toBe('active');
    expect(params.get('name')).toBeNull();
  });

  it('includes name when non-empty and name default is empty string', () => {
    const params = buildFilterSearchParams({ status: 'all', name: 'order' }, defaults);
    expect(params.get('name')).toBe('order');
    expect(params.get('status')).toBeNull();
  });

  it('omits undefined values', () => {
    const params = buildFilterSearchParams({ status: undefined, name: 'abc' }, defaults);
    expect(params.get('status')).toBeNull();
    expect(params.get('name')).toBe('abc');
  });

  it('combines multiple non-default values', () => {
    const params = buildFilterSearchParams({ status: 'active', name: 'order' }, defaults);
    expect(params.get('status')).toBe('active');
    expect(params.get('name')).toBe('order');
  });
});
