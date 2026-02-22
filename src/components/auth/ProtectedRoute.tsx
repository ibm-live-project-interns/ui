/**
 * Protected Route Component
 *
 * Wraps routes that require authentication.
 * Handles OAuth token from URL params before checking auth.
 * Redirects to login if user is not authenticated.
 */

import { useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Loading } from '@carbon/react';
import { authService } from '@/features/auth/services/authService';
import { logger } from '@/shared/utils/logger';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

    /**
     * Perform the full auth check, including handling OAuth tokens in URL params
     * and ensuring user profile is loaded.
     */
    const checkAuth = useCallback(async () => {
        const token = searchParams.get('token');
        const oauthError = searchParams.get('error');

        if (oauthError) {
            logger.error('[ProtectedRoute] OAuth error', new Error(oauthError));
            window.location.href = `/login?error=${encodeURIComponent(oauthError)}`;
            return;
        }

        if (token) {
            logger.info('Processing OAuth token from URL');
            // Clean up URL by removing token param
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('token');
            setSearchParams(newParams, { replace: true });

            // setOAuthToken is async -- it loads the user profile before resolving
            await authService.setOAuthToken(token);
        }

        // Require both a valid token and a loaded user profile to be considered authenticated
        const isAuthed = await authService.ensureAuthenticated();
        setAuthState(isAuthed ? 'authenticated' : 'unauthenticated');
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Show loading while checking authentication
    if (authState === 'loading') {
        return (
            <div className="page-loader">
                <Loading withOverlay={false} description="Completing sign in..." />
            </div>
        );
    }

    // Redirect unauthenticated users to login, preserving the attempted URL
    if (authState === 'unauthenticated') {
        // Redirect to login, but save the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
