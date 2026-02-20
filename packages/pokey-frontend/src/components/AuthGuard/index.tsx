import { useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../hooks/use-auth';
import type { AuthState } from '../../hooks/use-auth';
import {
  isLocalMode,
  isAuthenticated as checkAuthenticated,
  getAccessToken,
  getUserAlias,
  getUserRole,
  clearTokens,
  saveUrlState,
} from '../../services/auth';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): React.JSX.Element {
  const location = useLocation();
  const [, setAuthVersion] = useState(0);

  const forceRefresh = useCallback((): void => {
    setAuthVersion((v) => v + 1);
  }, []);

  const isLocal = isLocalMode();
  const authenticated = checkAuthenticated();

  const signOut = useCallback((): void => {
    clearTokens();
    forceRefresh();
  }, [forceRefresh]);

  const authState: AuthState = useMemo(
    () => ({
      isAuthenticated: authenticated,
      isLocal,
      accessToken: isLocal ? 'local-token' : getAccessToken(),
      userAlias: isLocal ? 'Local Developer' : (getUserAlias() ?? 'Unknown'),
      userRole: isLocal ? 'local-admin' : (getUserRole() ?? 'unknown'),
      signOut,
    }),
    [authenticated, isLocal, signOut],
  );

  const isAuthRoute = location.pathname === '/okta-signin' || location.pathname === '/okta-redirect';

  if (!authenticated && !isLocal && !isAuthRoute) {
    saveUrlState(location.pathname + location.search);
    return <Navigate to="/okta-signin" replace />;
  }

  return <AuthContext value={authState}>{children}</AuthContext>;
}
