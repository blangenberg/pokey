import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAccessToken,
  getRefreshToken,
  getUserAlias,
  getUserRole,
  storeTokens,
  clearTokens,
  isAuthenticated,
  saveUrlState,
  consumeUrlState,
} from './auth';

const STORAGE_KEY = btoa(window.location.origin);

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'RS256' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('token storage', () => {
  it('stores and retrieves access token', () => {
    storeTokens('access-123', 'refresh-456');
    expect(getAccessToken()).toBe('access-123');
  });

  it('stores and retrieves refresh token', () => {
    storeTokens('access-123', 'refresh-456');
    expect(getRefreshToken()).toBe('refresh-456');
  });

  it('stores and retrieves alias and role', () => {
    storeTokens('a', 'r', 'Alice', 'admin');
    expect(getUserAlias()).toBe('Alice');
    expect(getUserRole()).toBe('admin');
  });

  it('returns null for alias and role when not provided', () => {
    storeTokens('a', 'r');
    expect(getUserAlias()).toBeNull();
    expect(getUserRole()).toBeNull();
  });

  it('returns null when no tokens are stored', () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('clears all tokens', () => {
    storeTokens('a', 'r', 'Alice', 'admin');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getUserAlias()).toBeNull();
    expect(getUserRole()).toBeNull();
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

describe('isAuthenticated', () => {
  it('returns true in local mode (no VITE_STAGE set)', () => {
    expect(isAuthenticated()).toBe(true);
  });

  it('returns false when no refresh token exists (with VITE_STAGE set)', () => {
    vi.stubEnv('VITE_STAGE', 'prod');
    expect(isAuthenticated()).toBe(false);
    vi.unstubAllEnvs();
  });

  it('returns true for a valid non-expired JWT', () => {
    vi.stubEnv('VITE_STAGE', 'prod');
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const jwt = makeJwt({ exp: futureExp });
    storeTokens('access', jwt);
    expect(isAuthenticated()).toBe(true);
    vi.unstubAllEnvs();
  });

  it('returns false for an expired JWT', () => {
    vi.stubEnv('VITE_STAGE', 'prod');
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const jwt = makeJwt({ exp: pastExp });
    storeTokens('access', jwt);
    expect(isAuthenticated()).toBe(false);
    vi.unstubAllEnvs();
  });

  it('returns false for a JWT without exp claim', () => {
    vi.stubEnv('VITE_STAGE', 'prod');
    const jwt = makeJwt({ sub: 'user' });
    storeTokens('access', jwt);
    expect(isAuthenticated()).toBe(false);
    vi.unstubAllEnvs();
  });

  it('returns false for a malformed token (not 3 parts)', () => {
    vi.stubEnv('VITE_STAGE', 'prod');
    storeTokens('access', 'not-a-jwt');
    expect(isAuthenticated()).toBe(false);
    vi.unstubAllEnvs();
  });

  it('returns false for a token with invalid base64 payload', () => {
    vi.stubEnv('VITE_STAGE', 'prod');
    storeTokens('access', 'header.!!!invalid!!!.sig');
    expect(isAuthenticated()).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe('URL state persistence', () => {
  it('saves and consumes URL state', () => {
    saveUrlState('/schemas?status=active');
    expect(consumeUrlState()).toBe('/schemas?status=active');
    expect(localStorage.getItem('urlState')).toBeNull();
  });

  it('returns "/" when no URL state is saved', () => {
    expect(consumeUrlState()).toBe('/');
  });

  it('clears the saved state after consuming', () => {
    saveUrlState('/configs');
    consumeUrlState();
    expect(consumeUrlState()).toBe('/');
  });
});
