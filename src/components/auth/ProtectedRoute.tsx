/**
 * Protected Route Component
 *
 * Wraps routes that require authentication.
 * Handles OAuth token from URL params before checking auth.
 * Redirects to login if user is not authenticated.
 */

import { useEffect, useState, useMemo } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Loading } from '@carbon/react';
import { authService } from '@/features/auth/services/authService';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
    const [tokenProcessed, setTokenProcessed] = useState(false);

    // Check synchronously if there's a token in URL (before any async operations)
    const hasTokenInUrl = useMemo(() => {
        return searchParams.has('token');
    }, [searchParams]);

    // Handle OAuth token from URL params (e.g., after Google OAuth callback)
    useEffect(() => {
        const token = searchParams.get('token');
        const oauthError = searchParams.get('error');

        if (token) {
            console.log('[ProtectedRoute] Processing OAuth token from URL');
            setIsProcessingOAuth(true);

            // Set the token from OAuth callback
            authService.setOAuthToken(token);

            // Clean up URL by removing token param
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('token');
            setSearchParams(newParams, { replace: true });

            // Mark as complete after a brief delay to ensure token is stored
            setTimeout(() => {
                setIsProcessingOAuth(false);
                setTokenProcessed(true);
                console.log('[ProtectedRoute] OAuth token processed successfully');
            }, 50);
        } else if (oauthError) {
            console.error('[ProtectedRoute] OAuth error:', oauthError);
            // Redirect to login with error
            window.location.href = `/login?error=${encodeURIComponent(oauthError)}`;
        }
    }, [searchParams, setSearchParams]);

    // Show loading while we have a token in URL or actively processing
    if (hasTokenInUrl || isProcessingOAuth) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#161616'
            }}>
                <Loading withOverlay={false} description="Completing sign in..." />
            </div>
        );
    }

    // Check authentication - allow if authenticated OR if we just processed a token
    const isAuthenticated = authService.isAuthenticated() || tokenProcessed;

    if (!isAuthenticated) {
        // Redirect to login, but save the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
