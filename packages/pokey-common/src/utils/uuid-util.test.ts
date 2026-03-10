import { describe, it, expect } from 'vitest';
import { UuidUtil } from './uuid-util';

describe('UuidUtil', () => {
  const uuid = new UuidUtil();

  it('generates a valid UUID v4 string', () => {
    const result = uuid.generate();
    expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generates unique values on successive calls', () => {
    const a = uuid.generate();
    const b = uuid.generate();
    expect(a).not.toBe(b);
  });
});
