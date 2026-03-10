import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../hooks/use-auth';
import type { AuthState } from '../../hooks/use-auth';
import { Page } from './index';
import type { Story } from '@ladle/react';

const mockAuth: AuthState = {
  isAuthenticated: true,
  isLocal: true,
  accessToken: 'mock-token',
  userAlias: 'Test User',
  userRole: 'admin',
  signOut: (): void => undefined,
};

export const Default: Story = (): React.JSX.Element => (
  <BrowserRouter>
    <AuthContext value={mockAuth}>
      <Page>
        <div style={{ padding: 20 }}>
          <h3>Page Content Area</h3>
          <p>This is where the page body content renders.</p>
        </div>
      </Page>
    </AuthContext>
  </BrowserRouter>
);

export const ProductionStage: Story = (): React.JSX.Element => {
  const prodAuth: AuthState = { ...mockAuth, isLocal: false, userAlias: 'alice@acme.com', userRole: 'platform-admin' };
  return (
    <BrowserRouter>
      <AuthContext value={prodAuth}>
        <Page>
          <p style={{ padding: 20 }}>Production-like environment</p>
        </Page>
      </AuthContext>
    </BrowserRouter>
  );
};
