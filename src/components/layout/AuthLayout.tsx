import { Outlet } from 'react-router-dom';
import { Content } from '@carbon/react';
import { AuthHeader } from './AuthHeader';

/**
 * AuthLayout - Layout for authentication pages (login, register, forgot password)
 * 
 * Includes header with account option, but no sidebar.
 * Uses full viewport width for the auth forms.
 */
export function AuthLayout() {
    return (
        <>
            <AuthHeader />
            <Content className="auth-layout-content">
                <Outlet />
            </Content>
        </>
    );
}

export default AuthLayout;
