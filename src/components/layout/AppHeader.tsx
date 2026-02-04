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
    SettingsAdjust,
    Ticket,
    ChevronUp,
    Logout,
    Search as SearchIcon,
    Close,
    CheckmarkOutline,
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

// Search items type
type SearchableItem = {
    id: string;
    title: string;
    subtitle: string;
    type: 'alert' | 'ticket' | 'device' | 'page';
    url: string;
    severity?: string;
};

// Alert count and auth services
import { alertDataService, authService, ticketDataService } from '@/shared/services';
import { useRole } from '@/features/roles/hooks';
import { ROLE_NAMES } from '@/shared/types';
import { SEVERITY_COLORS } from '@/shared/constants/colors';

// Helper to get initials from username, email, or name
function getInitials(name?: string, email?: string): string {
    if (name && name.length > 0) {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }
    if (email) {
        return email.slice(0, 2).toUpperCase();
    }
    return '??';
}

// Helper to get display name
function getDisplayName(user: any): string {
    if (!user) return 'User';
    if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
    }
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return 'User';
}

/**
 * Notification Dropdown Component
 */
function NotificationDropdown() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load recent alerts as notifications
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const alerts = await alertDataService.getAlerts();
                // Get the 5 most recent alerts
                setNotifications(alerts.slice(0, 5));
            } catch (error) {
                console.error('Failed to load notifications:', error);
            }
        };
        loadNotifications();

        // Refresh every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (alertId: string) => {
        navigate(`/alerts/${alertId}`);
        setIsOpen(false);
    };

    const handleViewAll = () => {
        navigate('/priority-alerts');
        setIsOpen(false);
    };

    const getSeverityColor = (severity: string) => {
        return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.info;
    };

    return (
        <div className="notification-dropdown-container" ref={dropdownRef}>
            <HeaderGlobalAction
                aria-label="Notifications"
                tooltipAlignment="end"
                onClick={() => setIsOpen(!isOpen)}
                isActive={isOpen}
            >
                <Notification size={20} />
                {notifications.length > 0 && (
                    <span className="notification-badge">{notifications.length}</span>
                )}
            </HeaderGlobalAction>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                        <span className="notification-dropdown-title">Notifications</span>
                        <span className="notification-dropdown-count">{notifications.length} new</span>
                    </div>

                    <div className="notification-dropdown-list">
                        {notifications.length === 0 ? (
                            <div className="notification-dropdown-empty">
                                <CheckmarkOutline size={24} />
                                <span>No new notifications</span>
                            </div>
                        ) : (
                            notifications.map((alert) => (
                                <button
                                    key={alert.id}
                                    className="notification-dropdown-item"
                                    onClick={() => handleNotificationClick(alert.id)}
                                >
                                    <div
                                        className="notification-severity-indicator"
                                        style={{ backgroundColor: getSeverityColor(alert.severity) }}
                                    />
                                    <div className="notification-content">
                                        <span className="notification-title">{alert.aiTitle || 'Alert'}</span>
                                        <span className="notification-device">{alert.device?.name || 'Unknown Device'}</span>
                                        <span className="notification-time">{typeof alert.timestamp === 'string' ? alert.timestamp : alert.timestamp?.relative || 'Now'}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <button className="notification-dropdown-footer" onClick={handleViewAll}>
                        View all alerts
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Separate HeaderSearch component to isolate state from HeaderContainer re-renders
 */
function HeaderSearch() {
    // ... search implementation remains same
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [searchResults, setSearchResults] = useState<SearchableItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Searchable pages
    const searchablePages: SearchableItem[] = [
        { id: 'dashboard', title: 'Dashboard', subtitle: 'Main dashboard', type: 'page', url: '/dashboard' },
        { id: 'priority-alerts', title: 'Priority Alerts', subtitle: 'View all alerts', type: 'page', url: '/priority-alerts' },
        { id: 'trends', title: 'Trends & Insights', subtitle: 'Analytics and trends', type: 'page', url: '/trends' },
        { id: 'tickets', title: 'Tickets', subtitle: 'Ticket management', type: 'page', url: '/tickets' },
        { id: 'devices', title: 'Devices', subtitle: 'Device inventory', type: 'page', url: '/devices' },
        { id: 'configuration', title: 'Configuration', subtitle: 'Alert rules and settings', type: 'page', url: '/configuration' },
        { id: 'settings', title: 'Settings', subtitle: 'User settings', type: 'page', url: '/settings' },
    ];

    // Comprehensive search across all entities
    useEffect(() => {
        if (searchValue.trim()) {
            // Debounce search
            if (debounceRef.current) clearTimeout(debounceRef.current);

            debounceRef.current = setTimeout(async () => {
                setIsSearching(true);
                const query = searchValue.toLowerCase();
                const results: SearchableItem[] = [];

                // Search pages first (instant)
                const matchingPages = searchablePages.filter(page =>
                    page.title.toLowerCase().includes(query) ||
                    page.subtitle.toLowerCase().includes(query)
                );
                results.push(...matchingPages);

                try {
                    // Search alerts
                    const alerts = await alertDataService.getAlerts();
                    const matchingAlerts = alerts
                        .filter(alert =>
                            alert.id?.toLowerCase().includes(query) ||
                            alert.aiTitle?.toLowerCase().includes(query) ||
                            alert.aiSummary?.toLowerCase().includes(query) ||
                            alert.device?.name?.toLowerCase().includes(query) ||
                            alert.severity?.toLowerCase().includes(query)
                        )
                        .slice(0, 5)
                        .map(alert => ({
                            id: alert.id,
                            title: alert.aiTitle || alert.id,
                            subtitle: alert.device?.name || 'Unknown Device',
                            type: 'alert' as const,
                            url: `/alerts/${alert.id}`,
                            severity: alert.severity
                        }));
                    results.push(...matchingAlerts);
                } catch (error) {
                    console.error('Failed to search alerts:', error);
                }

                try {
                    // Search tickets
                    const tickets = await ticketDataService.getTickets();
                    const matchingTickets = tickets
                        .filter(ticket =>
                            ticket.title.toLowerCase().includes(query) ||
                            ticket.ticketNumber.toLowerCase().includes(query) ||
                            ticket.deviceName.toLowerCase().includes(query)
                        )
                        .slice(0, 5)
                        .map(ticket => ({
                            id: ticket.id,
                            title: `${ticket.ticketNumber} - ${ticket.title}`,
                            subtitle: ticket.deviceName,
                            type: 'ticket' as const,
                            url: `/tickets/${ticket.id}`
                        }));
                    results.push(...matchingTickets);
                } catch (error) {
                    console.error('Failed to search tickets:', error);
                }

                setSearchResults(results);
                setIsSearching(false);
                setShowResults(true);
            }, 300);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
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
                    {showResults && (
                        <div className="header-search-results" id="header-search-results" role="listbox" aria-label="Search results">
                            {isSearching ? (
                                <div className="header-search-loading" style={{ padding: '1rem', textAlign: 'center', color: 'var(--cds-text-secondary)' }}>
                                    Searching...
                                </div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map((result, index) => (
                                    <button
                                        key={result.url || index}
                                        className="header-search-result-item"
                                        onClick={() => handleResultClick(result.url)}
                                        role="option"
                                        aria-label={`Navigate to ${result.title}`}
                                    >
                                        <span className="header-search-result-label">{result.title}</span>
                                        <span className="header-search-result-type">{result.type}</span>
                                    </button>
                                ))
                            ) : searchValue.trim() ? (
                                <div className="header-search-no-results">
                                    No results found for "{searchValue}"
                                </div>
                            ) : null}
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
    const [criticalTicketCount, setCriticalTicketCount] = useState(0);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { hasPermission } = useRole();

    // Fetch alert count on mount and periodically
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const alertsCount = await alertDataService.getActiveAlertCount();
                setAlertCount(alertsCount);
            } catch (error) {
                console.debug('Alert count fetch skipped:', error);
                // Keep previous count or 0
            }

            // Get critical/high priority open tickets count
            try {
                const tickets = await ticketDataService.getTickets();
                const criticalCount = tickets.filter(
                    t => (t.priority === 'critical' || t.priority === 'high') &&
                        (t.status === 'open' || t.status === 'in-progress')
                ).length;
                setCriticalTicketCount(criticalCount);
            } catch (error) {
                console.debug('Ticket count fetch skipped:', error);
            }
        };
        fetchCounts();
        // Refresh every 30 seconds
        const interval = setInterval(fetchCounts, 30000);
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

                        {/* Notifications Dropdown */}
                        <NotificationDropdown />
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
                            {hasPermission('view-alerts') && (
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
                            )}



                            {/* Trends & Insights */}
                            {hasPermission('view-analytics') && (
                                <SideNavLink
                                    as={Link}
                                    to="/trends"
                                    renderIcon={ChartLine}
                                    isActive={isActive('/trends')}
                                >
                                    Trends & Insights
                                </SideNavLink>
                            )}

                            {/* Tickets with critical count badge */}
                            {hasPermission('view-tickets') && (
                                <SideNavLink
                                    as={Link}
                                    to="/tickets"
                                    renderIcon={Ticket}
                                    isActive={isActive('/tickets')}
                                    className={criticalTicketCount > 0 ? 'sidenav-link-with-badge' : ''}
                                >
                                    {criticalTicketCount > 0 ? (
                                        <>
                                            <span className="sidenav-link-text">Tickets</span>
                                            <Tag type="magenta" size="sm" className="sidenav-alert-badge">
                                                {criticalTicketCount}
                                            </Tag>
                                        </>
                                    ) : (
                                        'Tickets'
                                    )}
                                </SideNavLink>
                            )}

                            {/* Device Explorer */}
                            {hasPermission('view-devices') && (
                                <SideNavLink
                                    as={Link}
                                    to="/devices"
                                    renderIcon={Devices}
                                    isActive={isActive('/devices')}
                                >
                                    Devices
                                </SideNavLink>
                            )}

                            {/* Configuration */}
                            <SideNavLink
                                as={Link}
                                to="/configuration"
                                renderIcon={SettingsAdjust}
                                isActive={isActive('/configuration')}
                            >
                                Configuration
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
                                        authService.logout();
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
                                    {getInitials(authService.currentUser?.username, authService.currentUser?.email)}
                                </div>
                                <div className="sidenav-user-info">
                                    <span className="sidenav-user-name">{getDisplayName(authService.currentUser)}</span>
                                    <span className="sidenav-user-role">{authService.currentUser?.role ? ROLE_NAMES[authService.currentUser.role] : 'Viewer'}</span>
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
