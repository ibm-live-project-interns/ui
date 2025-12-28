import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    TextInput,
    Button,
    Tile,
    InlineLoading,
} from '@carbon/react';
import { Password, ArrowLeft, ArrowRight } from '@carbon/icons-react';
import '@/styles/AuthPages.scss';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setIsLoading(true);
        // Simulate password reset
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
        }, 1500);
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
                    <div className="auth-success">
                        <p>If an account with that email exists, we've sent password reset instructions.</p>
                        <Link to="/login" className="auth-link">
                            <ArrowLeft size={16} />
                            Back to login
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="auth-description">
                            Enter your email address and we'll send you instructions to reset your password.
                        </p>

                        {error && <div className="auth-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <TextInput
                                id="email"
                                labelText="Email"
                                type="email"
                                placeholder="Enter your email"
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
