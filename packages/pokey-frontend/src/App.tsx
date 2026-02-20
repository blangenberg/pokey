import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { OktaSignin } from './components/OktaSignin';
import { OktaRedirectHandler } from './components/OktaRedirectHandler';
import { Page } from './components/Page';
import { SchemaList } from './pages/schemas/SchemaList';
import { SchemaEditor } from './pages/schemas/SchemaEditor';
import { ConfigList } from './pages/configs/ConfigList';
import { ConfigEditor } from './pages/configs/ConfigEditor';
import './styles/global.scss';

export function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthGuard>
        <Routes>
          <Route path="/okta-signin" element={<OktaSignin />} />
          <Route path="/okta-redirect" element={<OktaRedirectHandler />} />
          <Route
            path="/*"
            element={
              <Page>
                <Routes>
                  <Route path="/" element={<Navigate to="/schemas" replace />} />
                  <Route path="/schemas" element={<SchemaList />} />
                  <Route path="/schemas/new" element={<SchemaEditor />} />
                  <Route path="/schemas/:id" element={<SchemaEditor />} />
                  <Route path="/configs" element={<ConfigList />} />
                  <Route path="/configs/new" element={<ConfigEditor />} />
                  <Route path="/configs/:id" element={<ConfigEditor />} />
                </Routes>
              </Page>
            }
          />
        </Routes>
      </AuthGuard>
    </BrowserRouter>
  );
}
