import { Navbar, Tag, H3, Button, Popover, Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
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

  const userMenu = (
    <Menu className="aura-session-menu">
      <MenuItem text={userRole} disabled icon="user" />
      <MenuDivider />
      <MenuItem text="Sign out" intent="danger" icon="log-out" onClick={signOut} />
    </Menu>
  );

  return (
    <div className="aura-page">
      <div className="aura-page-nav">
        <Navbar>
          <Navbar.Group align="left">
            <Navbar.Heading onClick={handleLogoClick}>
              <Logo />
            </Navbar.Heading>
            <Button variant="minimal" icon="cog" text="Pokey" active onClick={handleLogoClick} />
          </Navbar.Group>

          <Navbar.Group align="right">
            <Tag className="aura-page-env" interactive>
              {currentStage.toUpperCase()}
            </Tag>
            <Navbar.Divider />
            <Popover content={userMenu} placement="bottom-end">
              <Button variant="minimal" icon="user" text={userAlias} />
            </Popover>
          </Navbar.Group>
        </Navbar>
      </div>

      <div className="aura-page-head">
        <H3 className="aura-page-head-title">Pokey</H3>
        <div className="aura-page-head-subnav">
          <Button variant={isSchemas ? 'outlined' : 'minimal'} text="Schemas" onClick={(): void => void navigate('/schemas')} />
          <Button variant={isConfigs ? 'outlined' : 'minimal'} text="Configs" onClick={(): void => void navigate('/configs')} />
        </div>
      </div>

      <div className="aura-page-bod">
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
    </div>
  );
}
