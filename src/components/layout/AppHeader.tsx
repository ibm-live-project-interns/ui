import {
    Header,
    HeaderContainer,
    HeaderName,
    HeaderMenuButton,
    HeaderGlobalBar,
    HeaderGlobalAction,
    SkipToContent,
    SideNav,
    SideNavItems,
    SideNavLink,
    Tag,
} from '@carbon/react';
import {
    Notification,
    Dashboard,
    WarningAlt,
    ChartLine,
    Devices,
    Settings,
    ChevronUp,
    Logout,
    Search as SearchIcon,
    Close,
} from '@carbon/icons-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * AppHeader Component - Carbon UI Shell
 * 
 * Implements the Carbon UI Shell pattern with responsive SideNav:
 * - Sidebar expanded by default on desktop
 * - Collapses to hamburger menu overlay on mobile
 * - Uses React Router Link for seamless client-side navigation
 * - User profile at bottom with logout option sliding up
 * - Expandable search that takes full width
 * 
 * @see https://carbondesignsystem.com/components/UI-shell-header/usage/
 */

// User and navigation data from centralized mocks
import { MOCK_USER, SEARCHABLE_ITEMS } from '@/__mocks__/alerts.mock';
// Alert count via service (works with mock or API)
import { alertDataService } from '@/services';

/**
 * Separate HeaderSearch component to isolate state from HeaderContainer re-renders
 */
function HeaderSearch() {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [searchResults, setSearchResults] = useState<typeof SEARCHABLE_ITEMS>([]);
    const [showResults, setShowResults] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter search results
    useEffect(() => {
        if (searchValue.trim()) {
            const filtered = SEARCHABLE_ITEMS.filter((item) =>
                item.label.toLowerCase().includes(searchValue.toLowerCase())
            );
            setSearchResults(filtered);
            setShowResults(true);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    }, [searchValue]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (!searchValue.trim()) {
                    setIsExpanded(false);
                }
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchValue]);

    // Focus input when expanded
    useEffect(() => {
        if (isExpanded && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isExpanded]);

    const handleExpand = useCallback(() => {
        setIsExpanded(true);
    }, []);

    const handleClose = useCallback(() => {
        setSearchValue('');
        setShowResults(false);
        setIsExpanded(false);
    }, []);

    const handleResultClick = useCallback((path: string) => {
        navigate(path);
        setSearchValue('');
        setShowResults(false);
        setIsExpanded(false);
    }, [navigate]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            handleClose();
        }
    }, [handleClose]);

    return (
        <div
            className={`header-expandable-search ${isExpanded ? 'expanded' : ''}`}
            ref={containerRef}
        >
            {!isExpanded ? (
                <HeaderGlobalAction
                    aria-label="Search"
                    onClick={handleExpand}
                >
                    <SearchIcon size={20} />
                </HeaderGlobalAction>
            ) : (
                <div className="header-search-expanded">
                    <SearchIcon size={20} className="header-search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="header-search-input"
                        placeholder="Search pages, devices..."
                        value={searchValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        aria-label="Search pages, devices, and alerts"
                        aria-expanded={showResults}
                        aria-controls="header-search-results"
                        role="combobox"
                        aria-autocomplete="list"
                    />
                    <button
                        className="header-search-close"
                        onClick={handleClose}
                        aria-label="Close search"
                    >
                        <Close size={20} />
                    </button>

                    {/* Search Results Dropdown */}
                    {showResults && searchResults.length > 0 && (
                        <div className="header-search-results" id="header-search-results" role="listbox" aria-label="Search results">
                            {searchResults.map((result, index) => (
                                <button
                                    key={result.path || index}
                                    className="header-search-result-item"
                                    onClick={() => handleResultClick(result.path)}
                                    role="option"
                                    aria-label={`Navigate to ${result.label}`}
                                >
                                    <span className="header-search-result-label">{result.label}</span>
                                    <span className="header-search-result-type">{result.type}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {showResults && searchValue.trim() && searchResults.length === 0 && (
                        <div className="header-search-results">
                            <div className="header-search-no-results">
                                No results found for "{searchValue}"
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function AppHeader() {
    const location = useLocation();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [alertCount, setAlertCount] = useState(0);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Fetch alert count on mount and periodically
    useEffect(() => {
        const fetchCount = async () => {
            const count = await alertDataService.getActiveAlertCount();
            setAlertCount(count);
        };
        fetchCount();
        // Refresh every 30 seconds
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <HeaderContainer
            render={({ isSideNavExpanded, onClickSideNavExpand }) => (
                <Header aria-label="IBM watsonx Alerts">
                    <SkipToContent />
                    <HeaderMenuButton
                        aria-label={isSideNavExpanded ? 'Close menu' : 'Open menu'}
                        onClick={onClickSideNavExpand}
                        isActive={isSideNavExpanded}
                        aria-expanded={isSideNavExpanded}
                    />
                    <HeaderName as={Link} to="/" prefix="IBM">
                        watsonx Alerts
                    </HeaderName>

                    {/* Global Bar - Expandable Search and Notifications */}
                    <HeaderGlobalBar>
                        {/* Isolated Search Component */}
                        <HeaderSearch />

                        {/* Notifications */}
                        <HeaderGlobalAction
                            aria-label="Notifications"
                            tooltipAlignment="end"
                        >
                            <Notification size={20} />
                        </HeaderGlobalAction>
                    </HeaderGlobalBar>

                    <SideNav
                        aria-label="Side navigation"
                        expanded={isSideNavExpanded}
                        onOverlayClick={onClickSideNavExpand}
                        onSideNavBlur={onClickSideNavExpand}
                        isChildOfHeader
                    >
                        <SideNavItems>
                            {/* Dashboard */}
                            <SideNavLink
                                as={Link}
                                to="/dashboard"
                                renderIcon={Dashboard}
                                isActive={isActive('/dashboard')}
                            >
                                Dashboard
                            </SideNavLink>

                            {/* Priority Alerts with dynamic badge */}
                            <SideNavLink
                                as={Link}
                                to="/priority-alerts"
                                renderIcon={WarningAlt}
                                isActive={isActive('/priority-alerts')}
                                className="sidenav-link-with-badge"
                            >
                                <span className="sidenav-link-text">Priority Alerts</span>
                                <Tag type="red" size="sm" className="sidenav-alert-badge">
                                    {alertCount}
                                </Tag>
                            </SideNavLink>



                            {/* Trends & Insights */}
                            <SideNavLink
                                as={Link}
                                to="/trends"
                                renderIcon={ChartLine}
                                isActive={isActive('/trends')}
                            >
                                Trends & Insights
                            </SideNavLink>

                            {/* Device Explorer */}
                            <SideNavLink
                                as={Link}
                                to="/devices"
                                renderIcon={Devices}
                                isActive={isActive('/devices')}
                            >
                                Device Explorer
                            </SideNavLink>

                            {/* Settings */}
                            <SideNavLink
                                as={Link}
                                to="/settings"
                                renderIcon={Settings}
                                isActive={isActive('/settings')}
                            >
                                Settings
                            </SideNavLink>
                        </SideNavItems>

                        {/* User Profile Footer - Logout slides up from bottom */}
                        <div className="sidenav-user-footer" ref={userMenuRef}>
                            {/* Logout menu - slides up when open */}
                            <div className={`sidenav-user-menu ${userMenuOpen ? 'open' : ''}`}>
                                <button
                                    className="sidenav-user-menu-item"
                                    onClick={() => {
                                        // Handle logout
                                        console.log('Logout clicked');
                                        setUserMenuOpen(false);
                                    }}
                                >
                                    <Logout size={16} />
                                    <span>Log out</span>
                                </button>
                            </div>

                            {/* User profile row - stays at bottom */}
                            <div
                                className="sidenav-user-profile"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && setUserMenuOpen(!userMenuOpen)}
                            >
                                <div className="sidenav-user-avatar">
                                    {MOCK_USER.initials}
                                </div>
                                <div className="sidenav-user-info">
                                    <span className="sidenav-user-name">{MOCK_USER.name}</span>
                                    <span className="sidenav-user-role">{MOCK_USER.role}</span>
                                </div>
                                <ChevronUp
                                    size={16}
                                    className={`sidenav-user-chevron ${userMenuOpen ? 'open' : ''}`}
                                />
                            </div>
                        </div>
                    </SideNav>
                </Header>
            )}
        />
    );
}

export default AppHeader;
