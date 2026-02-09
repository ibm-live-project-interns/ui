/**
 * Login Page
 *
 * User authentication with email/password and optional Google OAuth.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    TextInput,
    PasswordInput,
    Button,
    Tile,
    InlineLoading,
    InlineNotification,
} from '@carbon/react';
import { Login as LoginIcon, ArrowRight } from '@carbon/icons-react';
import { authService } from '@/shared/services';
import { env } from '@/shared/config';
import '@/styles/pages/_auth.scss';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Check if Google OAuth is enabled - require both the feature flag AND a non-empty client ID
    const isGoogleAuthEnabled = env.enableGoogleAuth && typeof env.googleClientId === 'string' && env.googleClientId.trim().length > 0;

    // Get the page user was trying to access before being redirected to login
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

    // Handle OAuth callback - token or error from URL params
    useEffect(() => {
        const token = searchParams.get('token');
        const oauthError = searchParams.get('error');

        if (oauthError) {
            setError(decodeURIComponent(oauthError));
            // Clean up URL
            searchParams.delete('error');
            setSearchParams(searchParams, { replace: true });
        } else if (token) {
            // Set the token from OAuth callback
            authService.setOAuthToken(token);
            // Clean up URL and redirect to destination
            navigate(from, { replace: true });
        }
    }, [searchParams, setSearchParams, navigate, from]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter your email and password');
            return;
        }

        setIsLoading(true);
        try {
            await authService.login(email, password);
            navigate(from, { replace: true });
        } catch (err: unknown) {
            console.error('Login failed:', err);
            const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsGoogleLoading(true);
        try {
            // Preflight check: verify the backend has Google OAuth configured
            // before redirecting. This avoids the user seeing raw JSON on a 501 page.
            const apiBaseUrl = env.apiBaseUrl || '';
            const googleLoginUrl = `${apiBaseUrl}/api/v1/auth/google/login?redirect=${encodeURIComponent(window.location.origin + from)}`;

            const response = await fetch(googleLoginUrl, {
                method: 'GET',
                redirect: 'manual', // Don't follow redirects - we want to check the status
            });

            // A successful Google OAuth initiation returns a 307 redirect to Google.
            // If we get 0 (opaque redirect in manual mode) or 307, proceed with navigation.
            if (response.type === 'opaqueredirect' || response.status === 307 || response.status === 302) {
                window.location.href = googleLoginUrl;
                return;
            }

            // If the backend returned an error (e.g., 501 Not Implemented), show it inline
            if (!response.ok) {
                let errorMessage = 'Google OAuth is not configured. Contact your administrator.';
                try {
                    const data = await response.json();
                    if (data.error) {
                        errorMessage = data.error;
                    }
                } catch {
                    // Response was not JSON, use default message
                }
                setError(errorMessage);
                setIsGoogleLoading(false);
                return;
            }

            // Fallback: if response is OK but not a redirect, navigate anyway
            window.location.href = googleLoginUrl;
        } catch (err) {
            console.error('Google login failed:', err);
            setError('Google login failed. Please try again.');
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Tile className="auth-card">
                <div className="auth-logo">
                    <LoginIcon size={32} />
                    <span>IBM watsonx Alerts</span>
                </div>

                <h1 className="auth-title">Sign In</h1>
                <p className="auth-subtitle">Enter your credentials to continue</p>

                {error && (
                    <InlineNotification
                        kind="error"
                        title="Error"
                        subtitle={error}
                        lowContrast
                        hideCloseButton
                        className="auth-notification"
                    />
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <TextInput
                        id="email"
                        type="email"
                        labelText="Email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading || isGoogleLoading}
                        invalid={!!error && !email}
                        invalidText="Email is required"
                    />

                    <div className="auth-password-row">
                        <PasswordInput
                            id="password"
                            labelText="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading || isGoogleLoading}
                            invalid={!!error && !password}
                            invalidText="Password is required"
                        />
                        <Link to="/forgot-password" className="auth-forgot-link">
                            Forgot password?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading || isGoogleLoading}
                        renderIcon={isLoading ? undefined : ArrowRight}
                    >
                        {isLoading ? (
                            <InlineLoading description="Logging in..." />
                        ) : (
                            'Log in'
                        )}
                    </Button>
                </form>

                {/* Google OAuth */}
                {isGoogleAuthEnabled && (
                    <>
                        <div className="auth-divider">
                            <span>or</span>
                        </div>
                        <Button
                            kind="tertiary"
                            className="auth-google-btn"
                            onClick={handleGoogleLogin}
                            disabled={isLoading || isGoogleLoading}
                        >
                            {isGoogleLoading ? (
                                <InlineLoading description="Connecting..." />
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Continue with Google
                                </>
                            )}
                        </Button>
                    </>
                )}

                <div className="auth-footer">
                    <span>Don't have an account?</span>
                    <Link to="/register" className="auth-link">
                        Create account
                    </Link>
                </div>
            </Tile>
        </div>
    );
}

export default LoginPage;
