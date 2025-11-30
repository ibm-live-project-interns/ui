import { Content } from '@carbon/react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';

export function AppLayout() {
  return (
    <div className="app">
      <AppHeader />
      <Content className="app__content">
        <Outlet />
      </Content>
    </div>
  );
}
