import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { AuthGuard } from './components/AuthGuard';
import { OktaSignin } from './components/OktaSignin';
import { OktaRedirectHandler } from './components/OktaRedirectHandler';
import { Page } from './components/Page';
import './styles/global.scss';

const SchemaList = lazy(() => import('./pages/schemas/SchemaList'));
const SchemaEditor = lazy(() => import('./pages/schemas/SchemaEditor'));
const ConfigList = lazy(() => import('./pages/configs/ConfigList'));
const ConfigEditor = lazy(() => import('./pages/configs/ConfigEditor'));

function LazyFallback(): React.JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Spin size="large" />
    </div>
  );
}

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
      <Suspense fallback={<LazyFallback />}>
        <Outlet />
      </Suspense>
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
