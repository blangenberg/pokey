import { describe, it, expect } from 'vitest';
import { encodeNextToken, decodeNextToken } from '../../helpers/pagination';

describe('pagination tokens', () => {
  it('round-trips a key through encode/decode', () => {
    const key = { id: { S: 'abc-123' } };
    const token = encodeNextToken(key);
    expect(decodeNextToken(token)).toEqual(key);
  });

  it('returns undefined for undefined input', () => {
    expect(decodeNextToken(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(decodeNextToken('')).toBeUndefined();
  });

  it('returns undefined for malformed base64', () => {
    expect(decodeNextToken('not-valid-base64!!!')).toBeUndefined();
  });
});
