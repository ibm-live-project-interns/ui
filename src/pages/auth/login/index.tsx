import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    TextInput,
    PasswordInput,
    Dropdown,
    Button,
    Tile,
    InlineLoading,
} from '@carbon/react';
import { Login as LoginIcon, ArrowRight } from '@carbon/icons-react';
import { authService } from '@/services/AuthService';
import '@/styles/AuthPages.scss';

const ROLES = [
    { id: 'operator', text: 'Operator' },
    { id: 'engineer', text: 'Engineer' },
    { id: 'admin', text: 'Administrator' },
];

export function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<{ id: string; text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get the page user was trying to access before being redirected to login
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password || !role) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            await authService.login(username, password, role);
            // Navigate to the page they were trying to access, or dashboard
            navigate(from, { replace: true });
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Tile className="auth-card">
                <div className="auth-logo">
                    <LoginIcon size={32} />
                    <span>IBM watsonx Alerts</span>
                </div>

                <h1 className="auth-title">Login</h1>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <TextInput
                        id="username"
                        labelText="User"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                    />

                    <div className="auth-password-row">
                        <PasswordInput
                            id="password"
                            labelText="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        <Link to="/forgot-password" className="auth-forgot-link">
                            Forgot password?
                        </Link>
                    </div>

                    <Dropdown
                        id="role"
                        titleText="Role"
                        label="Select role"
                        items={ROLES}
                        itemToString={(item) => item?.text || ''}
                        selectedItem={role}
                        onChange={({ selectedItem }) => setRole(selectedItem || null)}
                        disabled={isLoading}
                    />

                    <Button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading}
                        renderIcon={isLoading ? undefined : ArrowRight}
                    >
                        {isLoading ? (
                            <InlineLoading description="Logging in..." />
                        ) : (
                            'Log in'
                        )}
                    </Button>
                </form>

                <div className="auth-footer">
                    <Link to="/register" className="auth-link">
                        Create account
                    </Link>
                </div>
            </Tile>
        </div>
    );
}

export default LoginPage;
