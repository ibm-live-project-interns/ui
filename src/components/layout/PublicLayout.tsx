import { Outlet } from 'react-router-dom';
import { Content } from '@carbon/react';
import { AuthHeader } from './AuthHeader';

/**
 * PublicLayout - Layout for public pages (home/landing page)
 * 
 * Includes header with account option, but no sidebar.
 * Full-width layout for landing page experience.
 */
export function PublicLayout() {
    return (
        <>
            <AuthHeader />
            <Content className="public-layout-content">
                <Outlet />
            </Content>
        </>
    );
}

export default PublicLayout;
