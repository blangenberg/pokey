import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Button, Card } from '@blueprintjs/core';
import { Logo } from '../Logo';
import * as oauth from 'oauth4webapi';
import { isAuthenticated } from '../../services/auth';

export function OktaSignin(): React.JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      void navigate('/', { replace: true });
      return;
    }

    void initiateOktaFlow();
  }, []);

  async function initiateOktaFlow(): Promise<void> {
    try {
      const baseUrl = import.meta.env.VITE_OKTA_BASE_URL;
      const clientId = import.meta.env.VITE_OKTA_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_OKTA_REDIRECT_URI ?? 'http://localhost:3000/okta-redirect';

      if (!baseUrl || !clientId) {
        return;
      }

      const issuer = new URL(baseUrl);
      const as = await oauth.discoveryRequest(issuer).then((response) => oauth.processDiscoveryResponse(issuer, response));

      const codeVerifier = oauth.generateRandomCodeVerifier();
      sessionStorage.setItem('code_verifier', codeVerifier);
      const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);

      const authorizationUrl = new URL(as.authorization_endpoint as string);
      authorizationUrl.searchParams.set('client_id', clientId);
      authorizationUrl.searchParams.set('code_challenge', codeChallenge);
      authorizationUrl.searchParams.set('code_challenge_method', 'S256');
      authorizationUrl.searchParams.set('redirect_uri', redirectUri);
      authorizationUrl.searchParams.set('response_type', 'code');
      authorizationUrl.searchParams.set('scope', 'openid email profile groups');

      const urlState = localStorage.getItem('urlState') ?? '/';
      authorizationUrl.searchParams.set('state', urlState);

      window.location.href = authorizationUrl.toString();
    } catch (error: unknown) {
      console.error('Failed to initiate Okta sign-in:', error);
    }
  }

  const hasOktaConfig = Boolean(import.meta.env.VITE_OKTA_BASE_URL && import.meta.env.VITE_OKTA_CLIENT_ID);

  if (!hasOktaConfig) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Card style={{ textAlign: 'center', padding: 40, maxWidth: 400 }}>
          <Logo />
          <h2 style={{ marginTop: 20 }}>Pokey</h2>
          <p>Okta is not configured. Set VITE_OKTA_BASE_URL and VITE_OKTA_CLIENT_ID environment variables.</p>
          <Button intent="primary" icon="log-in" text="Sign in with Okta" disabled size="large" />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Spinner size={50} />
    </div>
  );
}
