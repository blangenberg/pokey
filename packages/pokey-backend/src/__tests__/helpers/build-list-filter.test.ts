import { describe, it, expect } from 'vitest';
import { buildListFilter } from '../../utils/build-list-filter';

describe('buildListFilter', () => {
  it('returns undefined filterExpression when no params provided', () => {
    const result = buildListFilter({});
    expect(result.filterExpression).toBeUndefined();
    expect(Object.keys(result.expressionAttributeNames)).toHaveLength(0);
    expect(Object.keys(result.expressionAttributeValues)).toHaveLength(0);
  });

  it('builds a name contains filter and lowercases the value', () => {
    const result = buildListFilter({ name: 'Dashboard' });
    expect(result.filterExpression).toBe('contains(#n, :nameFilter)');
    expect(result.expressionAttributeNames['#n']).toBe('name');
    expect(result.expressionAttributeValues[':nameFilter']).toBe('dashboard');
  });

  it('builds an id contains filter and lowercases the value', () => {
    const result = buildListFilter({ id: 'ABC-123' });
    expect(result.filterExpression).toBe('contains(id, :idFilter)');
    expect(result.expressionAttributeValues[':idFilter']).toBe('abc-123');
  });

  it('builds an exact status filter', () => {
    const result = buildListFilter({ status: 'active' });
    expect(result.filterExpression).toBe('#s = :status');
    expect(result.expressionAttributeNames['#s']).toBe('status');
    expect(result.expressionAttributeValues[':status']).toBe('active');
  });

  it('builds an exact schemaId filter', () => {
    const result = buildListFilter({ schemaId: 'dd000000-d000-4000-8000-d00000000001' });
    expect(result.filterExpression).toBe('schemaId = :schemaId');
    expect(result.expressionAttributeValues[':schemaId']).toBe('dd000000-d000-4000-8000-d00000000001');
  });

  it('combines multiple filters with AND', () => {
    const result = buildListFilter({ name: 'test', status: 'active' });
    expect(result.filterExpression).toBe('contains(#n, :nameFilter) AND #s = :status');
    expect(result.expressionAttributeNames['#n']).toBe('name');
    expect(result.expressionAttributeNames['#s']).toBe('status');
    expect(result.expressionAttributeValues[':nameFilter']).toBe('test');
    expect(result.expressionAttributeValues[':status']).toBe('active');
  });

  it('combines all four filters with AND', () => {
    const result = buildListFilter({ name: 'test', id: 'abc', status: 'disabled', schemaId: 'dd000000-d000-4000-8000-d00000000002' });
    expect(result.filterExpression).toBe('contains(#n, :nameFilter) AND contains(id, :idFilter) AND #s = :status AND schemaId = :schemaId');
    expect(Object.keys(result.expressionAttributeValues)).toHaveLength(4);
  });

  it('ignores undefined and empty-string params', () => {
    const result = buildListFilter({ name: undefined, id: '', status: undefined });
    expect(result.filterExpression).toBeUndefined();
  });
});
