// Auth Header - Simple header for auth pages with account option
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Header,
    HeaderName,
    HeaderGlobalBar,
    HeaderGlobalAction,
    SkipToContent,
} from '@carbon/react';
import {
    UserAvatar,
    Dashboard,
    Settings,
    Logout,
    ChevronDown,
} from '@carbon/icons-react';
import { env } from '@/shared/config';

// Mock logged-in state - replace with actual auth context
const mockUser = null; // Set to user object if logged in, null if not

export function AuthHeader() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAccountClick = () => {
        if (mockUser) {
            setIsMenuOpen(!isMenuOpen);
        } else {
            navigate('/login');
        }
    };

    return (
        <Header aria-label={env.appName}>
            <SkipToContent />
            <HeaderName as={Link} to="/" prefix="">
                {env.appName}
            </HeaderName>

            <HeaderGlobalBar>
                <div className="auth-header-account" ref={menuRef}>
                    <HeaderGlobalAction
                        aria-label={mockUser ? 'Account menu' : 'Login'}
                        tooltipAlignment="end"
                        onClick={handleAccountClick}
                    >
                        <UserAvatar size={20} />
                        {mockUser && <ChevronDown size={12} className="auth-header-chevron" />}
                    </HeaderGlobalAction>

                    {/* Dropdown menu for logged-in users */}
                    {mockUser && isMenuOpen && (
                        <div className="auth-header-dropdown">
                            <button
                                className="auth-header-dropdown-item"
                                onClick={() => {
                                    navigate('/dashboard');
                                    setIsMenuOpen(false);
                                }}
                            >
                                <Dashboard size={16} />
                                <span>Dashboard</span>
                            </button>
                            <button
                                className="auth-header-dropdown-item"
                                onClick={() => {
                                    navigate('/settings');
                                    setIsMenuOpen(false);
                                }}
                            >
                                <Settings size={16} />
                                <span>Settings</span>
                            </button>
                            <hr className="auth-header-dropdown-divider" />
                            <button
                                className="auth-header-dropdown-item"
                                onClick={() => {
                                    // Handle logout
                                    console.log('Logout');
                                    setIsMenuOpen(false);
                                }}
                            >
                                <Logout size={16} />
                                <span>Log out</span>
                            </button>
                        </div>
                    )}
                </div>
            </HeaderGlobalBar>
        </Header>
    );
}

export default AuthHeader;
