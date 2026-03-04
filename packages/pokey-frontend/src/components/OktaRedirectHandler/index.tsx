import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Modal, Button } from 'antd';
import { CrownOutlined, ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import * as oauth from 'oauth4webapi';
import { Logo } from '../Logo';
import { storeTokens, consumeUrlState } from '../../services/auth';

interface TokenState {
  idToken: string;
  accessToken: string | undefined;
}

interface IdTokenPayload {
  name?: string;
  email?: string;
  groups?: string[];
}

export function OktaRedirectHandler(): React.JSX.Element {
  const navigate = useNavigate();
  const [payload, setPayload] = useState<IdTokenPayload | null>(null);
  const [tokenState, setTokenState] = useState<TokenState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void handleRedirect();
  }, []);

  async function handleRedirect(): Promise<void> {
    try {
      const baseUrl = import.meta.env.VITE_OKTA_BASE_URL;
      const clientId = import.meta.env.VITE_OKTA_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_OKTA_REDIRECT_URI ?? 'http://localhost:3000/okta-redirect';
      if (!baseUrl || !clientId) {
        setError('Okta is not configured.');
        return;
      }
      const issuer = new URL(baseUrl);
      const discoveryResponse = await oauth.discoveryRequest(issuer);
      const as = await oauth.processDiscoveryResponse(issuer, discoveryResponse);
      const client: oauth.Client = { client_id: clientId, token_endpoint_auth_method: 'none' };
      const currentUrl = new URL(window.location.href);
      const savedState = localStorage.getItem('urlState') ?? '/';
      const params = oauth.validateAuthResponse(as, client, currentUrl, savedState);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- oauth4webapi type guard
      if (oauth.isOAuth2Error(params)) {
        const errDesc = (params as Record<string, unknown>).error_description;
        setError(typeof errDesc === 'string' ? errDesc : 'An OAuth2 error occurred.');
        return;
      }
      const codeVerifier = sessionStorage.getItem('code_verifier');
      if (!codeVerifier) {
        setError('Missing code verifier. Please try signing in again.');
        return;
      }
      const tokenResponse = await oauth.authorizationCodeGrantRequest(as, client, params, redirectUri, codeVerifier);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- oauth4webapi complex return types
      const result = await oauth.processAuthorizationCodeOpenIDResponse(as, client, tokenResponse);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- oauth4webapi type guard
      if (oauth.isOAuth2Error(result)) {
        const errDesc = (result as Record<string, unknown>).error_description;
        setError(typeof errDesc === 'string' ? errDesc : 'Token exchange failed.');
        return;
      }
      const resultRecord = result as Record<string, unknown>;
      const idToken = typeof resultRecord.id_token === 'string' ? resultRecord.id_token : undefined;
      const accessToken = typeof resultRecord.access_token === 'string' ? resultRecord.access_token : undefined;
      if (!idToken) {
        setError('No ID token received.');
        return;
      }
      const decodedPayload = JSON.parse(atob(idToken.split('.')[1] as string)) as IdTokenPayload;
      const groups = decodedPayload.groups ?? [];
      setTokenState({ idToken, accessToken });
      if (groups.length === 1) {
        completeAuth(idToken, accessToken, decodedPayload.name ?? decodedPayload.email, groups[0] as string);
      } else if (groups.length > 1) {
        setPayload(decodedPayload);
      } else {
        completeAuth(idToken, accessToken, decodedPayload.name ?? decodedPayload.email);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    }
  }

  function completeAuth(idToken: string, accessToken: string | undefined, alias?: string, role?: string): void {
    storeTokens(accessToken ?? idToken, idToken, alias, role);
    sessionStorage.removeItem('code_verifier');
    const redirectTo = consumeUrlState();
    void navigate(redirectTo, { replace: true });
  }

  function handleRoleSelect(role: string): void {
    if (!tokenState) return;
    completeAuth(tokenState.idToken, tokenState.accessToken, payload?.name ?? payload?.email, role);
  }

  function handleCancel(): void {
    localStorage.removeItem('urlState');
    void navigate('/', { replace: true });
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <h3>Authentication Error</h3>
          <p>{error}</p>
          <Button
            type="primary"
            onClick={(): void => {
              void navigate('/okta-signin', { replace: true });
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (payload && payload.groups && payload.groups.length > 1) {
    return (
      <Modal
        open
        title={null}
        className="aura-signin-dialog"
        footer={
          <Button icon={<ArrowLeftOutlined />} block size="large" onClick={handleCancel}>
            Cancel
          </Button>
        }
        closable={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Logo />
          <h3 style={{ marginTop: 16 }}>Pokey ({import.meta.env.VITE_STAGE ?? 'local'})</h3>
          <p>Welcome, {payload.name ?? payload.email}. Please choose your role:</p>
        </div>
        {payload.groups.map((group) => (
          <Button
            key={group}
            onClick={(): void => {
              handleRoleSelect(group);
            }}
            icon={<CrownOutlined />}
            block
            size="large"
            style={{ marginBottom: 10 }}
          >
            {group.split('-').pop()} <ArrowRightOutlined />
          </Button>
        ))}
      </Modal>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Spin size="large" />
    </div>
  );
}
