import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { OktaSignin } from './components/OktaSignin';
import { OktaRedirectHandler } from './components/OktaRedirectHandler';
import { Page } from './components/Page';
import { SchemaList } from './pages/schemas/SchemaList';
import { SchemaEditor } from './pages/schemas/SchemaEditor';
import { ConfigList } from './pages/configs/ConfigList';
import { ConfigEditor } from './pages/configs/ConfigEditor';
import './styles/global.scss';

function AuthLayout(): React.JSX.Element {
  return (
    <AuthGuard>
      <Outlet />
    </AuthGuard>
  );
}

function PageLayout(): React.JSX.Element {
  return (
    <Page>
      <Outlet />
    </Page>
  );
}

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/okta-signin', element: <OktaSignin /> },
      { path: '/okta-redirect', element: <OktaRedirectHandler /> },
      {
        element: <PageLayout />,
        children: [
          { path: '/', element: <Navigate to="/schemas" replace /> },
          { path: '/schemas', element: <SchemaList /> },
          { path: '/schemas/new', element: <SchemaEditor /> },
          { path: '/schemas/:id', element: <SchemaEditor /> },
          { path: '/configs', element: <ConfigList /> },
          { path: '/configs/new', element: <ConfigEditor /> },
          { path: '/configs/:id', element: <ConfigEditor /> },
        ],
      },
    ],
  },
]);

export function App(): React.JSX.Element {
  return <RouterProvider router={router} />;
}
