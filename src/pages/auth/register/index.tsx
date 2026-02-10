/**
 * Register Page
 *
 * New user registration with form validation.
 */

import { useState } from 'react';
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
import '@/styles/pages/_auth.scss';

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

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.register({
                email: formData.email,
                username: formData.email.split('@')[0],
                password: formData.password,
                first_name: formData.firstName,
                last_name: formData.lastName,
            });

            setSuccess(response.message);

            // Redirect to login after successful registration
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: unknown) {
            console.error('Registration failed:', err);
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
                    <span>IBM watsonx Alerts</span>
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
                        helperText="Minimum 8 characters"
                    />

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
