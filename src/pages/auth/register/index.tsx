/**
 * Register Page
 *
 * New user registration with form validation and password complexity requirements.
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    TextInput,
    PasswordInput,
    Button,
    Tile,
    InlineLoading,
    InlineNotification,
} from '@carbon/react';
import { UserFollow, ArrowRight } from '@carbon/icons-react';
import { authService } from '@/shared/services';
import { env } from '@/shared/config';
import { authLogger } from '@/shared/utils/logger';
import '@/styles/pages/_auth.scss';

// ==========================================
// Username derivation from email
// ==========================================

/** Derive a clean username from an email address.
 *  - Strips +tag suffixes (e.g., user+test@example.com -> user)
 *  - Truncates to 32 characters max
 *  - Replaces non-alphanumeric characters with hyphens
 */
function deriveUsername(email: string): string {
    const localPart = email.split('@')[0] || '';
    // Strip +tag suffix
    const stripped = localPart.split('+')[0];
    // Replace non-alphanumeric (except hyphens and underscores) with hyphens
    const cleaned = stripped.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    // Truncate to 32 characters
    return cleaned.substring(0, 32);
}

// ==========================================
// Password complexity validation
// ==========================================

interface PasswordCheck {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
}

function checkPasswordComplexity(password: string): PasswordCheck {
    return {
        hasMinLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
    };
}

function isPasswordValid(checks: PasswordCheck): boolean {
    return checks.hasMinLength && checks.hasUppercase && checks.hasLowercase && checks.hasNumber;
}

export function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // Track the redirect timeout so we can clean it up on unmount
    const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup redirect timeout on unmount
    useEffect(() => {
        return () => {
            if (redirectTimerRef.current !== null) {
                clearTimeout(redirectTimerRef.current);
            }
        };
    }, []);

    // Real-time password complexity state
    const passwordChecks = checkPasswordComplexity(formData.password);
    const showPasswordHints = formData.password.length > 0;

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!formData.firstName || !formData.email || !formData.password) {
            setError('Please fill in all required fields');
            return;
        }

        // Password complexity validation — require uppercase, lowercase, and number
        if (!isPasswordValid(passwordChecks)) {
            setError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.register({
                email: formData.email,
                // Derive username with edge case handling
                username: deriveUsername(formData.email),
                password: formData.password,
                first_name: formData.firstName,
                last_name: formData.lastName,
            });

            setSuccess(response.message);

            // Store timeout ref so it can be cleaned up on unmount
            redirectTimerRef.current = setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: unknown) {
            authLogger.error('Registration failed', err);
            const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Tile className="auth-card">
                <div className="auth-logo">
                    <UserFollow size={32} />
                    <span>{env.appName}</span>
                </div>

                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Register for access</p>

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

                {success && (
                    <InlineNotification
                        kind="success"
                        title="Success"
                        subtitle={success}
                        lowContrast
                        hideCloseButton
                        className="auth-notification"
                    />
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-name-row">
                        <TextInput
                            id="firstName"
                            labelText="First Name"
                            value={formData.firstName}
                            onChange={handleChange('firstName')}
                            disabled={isLoading}
                        />
                        <TextInput
                            id="lastName"
                            labelText="Last Name"
                            value={formData.lastName}
                            onChange={handleChange('lastName')}
                            disabled={isLoading}
                        />
                    </div>

                    <TextInput
                        id="email"
                        labelText="Email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange('email')}
                        disabled={isLoading}
                    />

                    <PasswordInput
                        id="password"
                        labelText="Password"
                        value={formData.password}
                        onChange={handleChange('password')}
                        disabled={isLoading}
                        helperText="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                    />

                    {/* Password complexity indicators */}
                    {showPasswordHints && (
                        <div className="auth-password-hints">
                            <span className={`auth-password-hint ${passwordChecks.hasMinLength ? 'auth-password-hint--pass' : 'auth-password-hint--fail'}`}>
                                {passwordChecks.hasMinLength ? '\u2713' : '\u2717'} At least 8 characters
                            </span>
                            <span className={`auth-password-hint ${passwordChecks.hasUppercase ? 'auth-password-hint--pass' : 'auth-password-hint--fail'}`}>
                                {passwordChecks.hasUppercase ? '\u2713' : '\u2717'} At least 1 uppercase letter
                            </span>
                            <span className={`auth-password-hint ${passwordChecks.hasLowercase ? 'auth-password-hint--pass' : 'auth-password-hint--fail'}`}>
                                {passwordChecks.hasLowercase ? '\u2713' : '\u2717'} At least 1 lowercase letter
                            </span>
                            <span className={`auth-password-hint ${passwordChecks.hasNumber ? 'auth-password-hint--pass' : 'auth-password-hint--fail'}`}>
                                {passwordChecks.hasNumber ? '\u2713' : '\u2717'} At least 1 number
                            </span>
                        </div>
                    )}

                    <PasswordInput
                        id="confirmPassword"
                        labelText="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange('confirmPassword')}
                        disabled={isLoading}
                    />

                    <Button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading || !!success}
                        renderIcon={isLoading ? undefined : ArrowRight}
                    >
                        {isLoading ? (
                            <InlineLoading description="Creating account..." />
                        ) : (
                            'Create Account'
                        )}
                    </Button>
                </form>

                <div className="auth-footer">
                    <span>Already have an account?</span>
                    <Link to="/login" className="auth-link">
                        Log in
                    </Link>
                </div>
            </Tile>
        </div>
    );
}

export default RegisterPage;
