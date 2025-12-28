import { Outlet } from 'react-router-dom';
import { Content } from '@carbon/react';
import { AppHeader } from './AppHeader';

/**
 * AppLayout - Main application layout using Carbon UI Shell
 * 
 * Structure:
 * - AppHeader: Header with persistent SideNav (always expanded on desktop)
 * - Content: Main content area with proper Carbon spacing
 * - Outlet: React Router nested routes render here
 * 
 * The Content component from Carbon automatically adds proper margin
 * to offset from the header (48px top). For expanded SideNav (256px),
 * we apply additional styling.
 */
export function AppLayout() {
    return (
        <>
            <AppHeader />
            <Content className="app-main-content">
                <Outlet />
            </Content>
        </>
    );
}

export default AppLayout;
