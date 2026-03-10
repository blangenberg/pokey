import { describe, it, expect } from 'vitest';
import { DateTimeUtil } from './datetime-util';

describe('DateTimeUtil', () => {
  const dt = new DateTimeUtil();

  it('returns a valid ISO-8601 string', () => {
    const result = dt.now();
    expect(new Date(result).toISOString()).toBe(result);
  });

  it('returns non-decreasing values on successive calls', () => {
    const a = dt.now();
    const b = dt.now();
    expect(b >= a).toBe(true);
  });
});
