import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    TextInput,
    PasswordInput,
    Button,
    Tile,
    InlineLoading,
} from '@carbon/react';
import { UserFollow, ArrowRight } from '@carbon/icons-react';
import { authService } from '@/services/AuthService';
import '@/styles/AuthPages.scss';

export function RegisterPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.fullName || !formData.email || !formData.password) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            // Split full name into first and last name
            const names = formData.fullName.split(' ');
            const firstName = names[0];
            const lastName = names.slice(1).join(' ') || 'User';

            await authService.register({
                firstName,
                lastName,
                email: formData.email,
                password: formData.password,
                role: { id: 'operator', text: 'Operator' } // Default role
            });

            // Redirect to login on success
            window.location.href = '/login';
        } catch (err: any) {
            console.error('Registration failed:', err);
            setError(err.message || 'Registration failed. Please try again.');
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

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <TextInput
                        id="fullName"
                        labelText="Full Name"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleChange('fullName')}
                        disabled={isLoading}
                    />

                    <TextInput
                        id="email"
                        labelText="Email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange('email')}
                        disabled={isLoading}
                    />

                    <PasswordInput
                        id="password"
                        labelText="Password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange('password')}
                        disabled={isLoading}
                    />

                    <PasswordInput
                        id="confirmPassword"
                        labelText="Confirm Password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange('confirmPassword')}
                        disabled={isLoading}
                    />

                    <Button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading}
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
