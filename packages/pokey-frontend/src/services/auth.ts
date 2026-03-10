const STORAGE_KEY = btoa(window.location.origin);

interface StoredAuth {
  access_token: string | null;
  refresh_token: string | null;
  user_alias: string | null;
  user_role: string | null;
}

const EMPTY_AUTH: StoredAuth = {
  access_token: null,
  refresh_token: null,
  user_alias: null,
  user_role: null,
};

function getStoredAuth(): StoredAuth {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_AUTH;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return EMPTY_AUTH;
  }
}

export function getAccessToken(): string | null {
  return getStoredAuth().access_token;
}

export function getRefreshToken(): string | null {
  return getStoredAuth().refresh_token;
}

export function getUserAlias(): string | null {
  return getStoredAuth().user_alias;
}

export function getUserRole(): string | null {
  return getStoredAuth().user_role;
}

export function storeTokens(accessToken: string, refreshToken: string, alias?: string, role?: string): void {
  const auth: StoredAuth = {
    access_token: accessToken,
    refresh_token: refreshToken,
    user_alias: alias ?? null,
    user_role: role ?? null,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isLocalMode(): boolean {
  const stage = import.meta.env.VITE_STAGE;
  return !stage || stage === 'local';
}

export function isAuthenticated(): boolean {
  if (isLocalMode()) return true;
  const token = getRefreshToken();
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1] as string)) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function saveUrlState(path: string): void {
  localStorage.setItem('urlState', path);
}

export function consumeUrlState(): string {
  const state = localStorage.getItem('urlState') ?? '/';
  localStorage.removeItem('urlState');
  return state;
}
