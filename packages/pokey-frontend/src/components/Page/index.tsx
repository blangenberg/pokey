import { Tag, Button, Dropdown } from 'antd';
import { SettingOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { Logo } from '../Logo';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import '../../styles/page.scss';
import type { ReactNode } from 'react';

interface PageProps {
  children: ReactNode;
}

export function Page({ children }: PageProps): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { userAlias, userRole, signOut } = useAuth();

  const currentStage = import.meta.env.VITE_STAGE ?? 'LOCAL';

  const isSchemas = location.pathname.startsWith('/schemas');
  const isConfigs = location.pathname.startsWith('/configs');

  function handleLogoClick(): void {
    void navigate('/');
  }

  const userMenuItems = [
    {
      key: 'role',
      label: userRole,
      disabled: true,
      icon: <UserOutlined />,
    },
    { type: 'divider' as const },
    {
      key: 'signout',
      label: 'Sign out',
      danger: true,
      icon: <LogoutOutlined />,
      onClick: signOut,
    },
  ];

  return (
    <div className="aura-page">
      <div className="aura-page-nav">
        <div className="aura-navbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
              <Logo />
            </div>
            <Button type="text" icon={<SettingOutlined />} onClick={handleLogoClick}>
              Pokey
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <Tag className="aura-page-env">{currentStage.toUpperCase()}</Tag>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Button type="text" icon={<UserOutlined />}>
                {userAlias}
              </Button>
            </Dropdown>
          </div>
        </div>
      </div>

      <div className="aura-page-head">
        <h3 className="aura-page-head-title">Pokey</h3>
        <div className="aura-page-head-subnav">
          <Button
            type={isSchemas ? 'default' : 'text'}
            onClick={(): void => {
              void navigate('/schemas');
            }}
          >
            Schemas
          </Button>
          <Button
            type={isConfigs ? 'default' : 'text'}
            onClick={(): void => {
              void navigate('/configs');
            }}
          >
            Configs
          </Button>
        </div>
      </div>

      <div className="aura-page-bod">
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
    </div>
  );
}
