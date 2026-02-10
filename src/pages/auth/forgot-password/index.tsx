/**
 * Forgot Password Page
 *
 * Request password reset via email.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    TextInput,
    Button,
    Tile,
    InlineLoading,
    InlineNotification,
} from '@carbon/react';
import { Password, ArrowLeft, ArrowRight } from '@carbon/icons-react';
import { authService } from '@/shared/services';
import '@/styles/pages/_auth.scss';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setIsLoading(true);

        try {
            await authService.forgotPassword(email);
            setIsSubmitted(true);
        } catch (err: unknown) {
            console.error('Password reset request failed:', err);
            // Don't reveal if email exists for security
            setIsSubmitted(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Tile className="auth-card">
                <div className="auth-logo">
                    <Password size={32} />
                    <span>IBM watsonx Alerts</span>
                </div>

                <h1 className="auth-title">Reset Password</h1>

                {isSubmitted ? (
                    <>
                        <InlineNotification
                            kind="success"
                            title="Email sent"
                            subtitle="Check your inbox for reset instructions."
                            lowContrast
                            hideCloseButton
                            className="auth-notification"
                        />
                        <div className="auth-footer" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
                            <Link to="/login" className="auth-link">
                                <ArrowLeft size={16} />
                                Back to login
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="auth-subtitle">
                            Enter your email to receive reset instructions.
                        </p>

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
                                labelText="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />

                            <Button
                                type="submit"
                                className="auth-submit-btn"
                                disabled={isLoading}
                                renderIcon={isLoading ? undefined : ArrowRight}
                            >
                                {isLoading ? (
                                    <InlineLoading description="Sending..." />
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>
                        </form>

                        <div className="auth-footer">
                            <Link to="/login" className="auth-link">
                                <ArrowLeft size={16} />
                                Back to login
                            </Link>
                        </div>
                    </>
                )}
            </Tile>
        </div>
    );
}

export default ForgotPasswordPage;
