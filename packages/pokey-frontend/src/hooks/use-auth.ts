import { createContext, useContext } from 'react';

export interface AuthState {
  isAuthenticated: boolean;
  isLocal: boolean;
  accessToken: string | null;
  userAlias: string;
  userRole: string;
  signOut: () => void;
}

const DEFAULT_AUTH: AuthState = {
  isAuthenticated: false,
  isLocal: false,
  accessToken: null,
  userAlias: '',
  userRole: '',
  signOut: () => undefined,
};

export const AuthContext = createContext<AuthState>(DEFAULT_AUTH);

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
