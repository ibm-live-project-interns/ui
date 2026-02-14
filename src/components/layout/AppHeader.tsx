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
    SideNavMenu,
    Tag,
} from '@carbon/react';
import {
    Notification,
    Dashboard,
    ChartLine,
    Devices,
    Settings,
    SettingsAdjust,
    ChevronUp,
    Logout,
    Search as SearchIcon,
    Close,
    CheckmarkOutline,
    UserAvatar,
    Security,
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
import { env } from '@/shared/config';

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
 *
 * Shares alert data with the main AppHeader component to avoid duplicate polling.
 */
function NotificationDropdown({ notifications }: { notifications: any[] }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
                                        <span className="notification-title">{alert.title || alert.description || 'Alert'}</span>
                                        <span className="notification-device">{alert.source || (typeof alert.device === 'string' ? alert.device : alert.device?.name) || 'Unknown Device'}</span>
                                        <span className="notification-time">{alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : 'Now'}</span>
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
        { id: 'incident-history', title: 'Incident History', subtitle: 'Resolved incidents and root causes', type: 'page', url: '/incident-history' },
        { id: 'sla-reports', title: 'SLA Reports', subtitle: 'Service level agreement reports', type: 'page', url: '/reports/sla' },
        { id: 'reports', title: 'Reports', subtitle: 'Reports hub and data exports', type: 'page', url: '/reports' },
        { id: 'service-status', title: 'Service Status', subtitle: 'Service health and availability', type: 'page', url: '/service-status' },
        { id: 'tickets', title: 'Tickets', subtitle: 'Ticket management', type: 'page', url: '/tickets' },
        { id: 'devices', title: 'Devices', subtitle: 'Device inventory', type: 'page', url: '/devices' },
        { id: 'device-groups', title: 'Device Groups', subtitle: 'Organize devices into logical groups', type: 'page', url: '/device-groups' },
        { id: 'configuration', title: 'Alert Configuration', subtitle: 'Alert rules and settings', type: 'page', url: '/configuration' },
        { id: 'settings', title: 'Settings', subtitle: 'User settings', type: 'page', url: '/settings' },
        { id: 'profile', title: 'Profile', subtitle: 'User profile management', type: 'page', url: '/profile' },
        { id: 'audit-log', title: 'Audit Log', subtitle: 'System audit trail', type: 'page', url: '/admin/audit-log' },
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
                    // Search alerts - using correct Alert interface fields:
                    // id, title, description, severity, source, device, ai_summary
                    const alerts = await alertDataService.getAlerts();
                    const matchingAlerts = alerts
                        .filter((alert: any) =>
                            alert.id?.toLowerCase().includes(query) ||
                            alert.title?.toLowerCase().includes(query) ||
                            alert.description?.toLowerCase().includes(query) ||
                            alert.ai_summary?.toLowerCase().includes(query) ||
                            alert.source?.toLowerCase().includes(query) ||
                            alert.severity?.toLowerCase().includes(query)
                        )
                        .slice(0, 5)
                        .map((alert: any) => ({
                            id: alert.id,
                            title: alert.title || alert.description || alert.id,
                            subtitle: alert.source || alert.device || 'Unknown Device',
                            type: 'alert' as const,
                            url: `/alerts/${alert.id}`,
                            severity: alert.severity
                        }));
                    results.push(...matchingAlerts);
                } catch (error) {
                    console.error('Failed to search alerts:', error);
                }

                try {
                    // Search tickets - using correct TicketInfo interface fields:
                    // id, ticketNumber, title, deviceName, assignedTo
                    const tickets = await ticketDataService.getTickets();
                    const matchingTickets = tickets
                        .filter(ticket =>
                            ticket.title?.toLowerCase().includes(query) ||
                            (ticket.ticketNumber && ticket.ticketNumber.toLowerCase().includes(query)) ||
                            (ticket.deviceName && ticket.deviceName.toLowerCase().includes(query))
                        )
                        .slice(0, 5)
                        .map(ticket => ({
                            id: ticket.id,
                            title: `${ticket.ticketNumber || ticket.id} - ${ticket.title}`,
                            subtitle: ticket.deviceName || 'Unknown Device',
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
    // Shared notification alerts -- single polling source to avoid duplicate API calls
    const [notificationAlerts, setNotificationAlerts] = useState<any[]>([]);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { hasPermission, currentRole } = useRole();

    // Single polling loop for alert count, ticket count, and notification alerts
    useEffect(() => {
        // Check auto-refresh setting from localStorage
        const autoRefreshSetting = localStorage.getItem('settings_autoRefresh');
        const autoRefreshEnabled = autoRefreshSetting !== 'false';

        const fetchCounts = async () => {
            try {
                const alertsCount = await alertDataService.getActiveAlertCount();
                setAlertCount(alertsCount);
            } catch (error) {
                console.debug('Alert count fetch skipped:', error);
            }

            // Fetch recent alerts for notification dropdown (shared data, no duplicate polling)
            try {
                const alerts = await alertDataService.getAlerts();
                setNotificationAlerts(alerts.slice(0, 5));
            } catch (error) {
                console.debug('Notification alerts fetch skipped:', error);
            }

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

        // Only set interval if auto-refresh is enabled
        let interval: ReturnType<typeof setInterval> | null = null;
        if (autoRefreshEnabled) {
            interval = setInterval(fetchCounts, 30000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
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
                <Header aria-label={env.appName}>
                    <SkipToContent />
                    <HeaderMenuButton
                        aria-label={isSideNavExpanded ? 'Close menu' : 'Open menu'}
                        onClick={onClickSideNavExpand}
                        isActive={isSideNavExpanded}
                        aria-expanded={isSideNavExpanded}
                    />
                    <HeaderName as={Link} to="/" prefix="">
                        {env.appName}
                    </HeaderName>

                    {/* Global Bar - Expandable Search and Notifications */}
                    <HeaderGlobalBar>
                        {/* Isolated Search Component */}
                        <HeaderSearch />

                        {/* Notifications Dropdown */}
                        <NotificationDropdown notifications={notificationAlerts} />
                    </HeaderGlobalBar>

                    <SideNav
                        aria-label="Side navigation"
                        expanded={isSideNavExpanded}
                        onOverlayClick={onClickSideNavExpand}
                        onSideNavBlur={onClickSideNavExpand}
                        isChildOfHeader
                    >
                        <SideNavItems>
                            {/* ========================================
                                OPERATIONS
                               ======================================== */}
                            <SideNavMenu
                                title="Operations"
                                renderIcon={Dashboard}
                                defaultExpanded
                                isActive={
                                    isActive('/dashboard') ||
                                    isActive('/priority-alerts') ||
                                    isActive('/tickets') ||
                                    isActive('/on-call') ||
                                    isActive('/service-status')
                                }
                            >
                                <SideNavLink
                                    as={Link}
                                    to="/dashboard"
                                    isActive={isActive('/dashboard')}
                                >
                                    Dashboard
                                </SideNavLink>

                                {hasPermission('view-alerts') && (
                                    <SideNavLink
                                        as={Link}
                                        to="/priority-alerts"
                                        isActive={isActive('/priority-alerts')}
                                        className="sidenav-link-with-badge"
                                    >
                                        <span className="sidenav-link-text">Priority Alerts</span>
                                        <Tag type="red" size="sm" className="sidenav-alert-badge">
                                            {alertCount}
                                        </Tag>
                                    </SideNavLink>
                                )}

                                {hasPermission('view-tickets') && (
                                    <SideNavLink
                                        as={Link}
                                        to="/tickets"
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

                                <SideNavLink
                                    as={Link}
                                    to="/on-call"
                                    isActive={isActive('/on-call')}
                                >
                                    On-Call Schedule
                                </SideNavLink>

                                <SideNavLink
                                    as={Link}
                                    to="/service-status"
                                    isActive={isActive('/service-status')}
                                >
                                    Service Status
                                </SideNavLink>
                            </SideNavMenu>

                            {/* ========================================
                                INFRASTRUCTURE
                               ======================================== */}
                            {hasPermission('view-devices') && (
                                <SideNavMenu
                                    title="Infrastructure"
                                    renderIcon={Devices}
                                    defaultExpanded
                                    isActive={isActive('/devices') || isActive('/topology') || isActive('/device-groups')}
                                >
                                    <SideNavLink
                                        as={Link}
                                        to="/devices"
                                        isActive={isActive('/devices')}
                                    >
                                        Devices
                                    </SideNavLink>
                                    <SideNavLink
                                        as={Link}
                                        to="/topology"
                                        isActive={isActive('/topology')}
                                    >
                                        Network Topology
                                    </SideNavLink>
                                    <SideNavLink
                                        as={Link}
                                        to="/device-groups"
                                        isActive={isActive('/device-groups')}
                                    >
                                        Device Groups
                                    </SideNavLink>
                                </SideNavMenu>
                            )}

                            {/* ========================================
                                ANALYTICS
                               ======================================== */}
                            {hasPermission('view-analytics') && (
                                <SideNavMenu
                                    title="Analytics"
                                    renderIcon={ChartLine}
                                    defaultExpanded
                                    isActive={
                                        isActive('/trends') ||
                                        isActive('/incident-history') ||
                                        isActive('/reports')
                                    }
                                >
                                    <SideNavLink
                                        as={Link}
                                        to="/trends"
                                        isActive={isActive('/trends')}
                                    >
                                        Trends & Insights
                                    </SideNavLink>

                                    <SideNavLink
                                        as={Link}
                                        to="/incident-history"
                                        isActive={isActive('/incident-history')}
                                    >
                                        Incident History
                                    </SideNavLink>

                                    <SideNavLink
                                        as={Link}
                                        to="/reports/sla"
                                        isActive={isActive('/reports/sla')}
                                    >
                                        SLA Reports
                                    </SideNavLink>

                                    <SideNavLink
                                        as={Link}
                                        to="/reports"
                                        isActive={isActive('/reports') && !isActive('/reports/sla')}
                                    >
                                        Reports
                                    </SideNavLink>
                                </SideNavMenu>
                            )}

                            {/* ========================================
                                CONFIGURATION
                               ======================================== */}
                            <SideNavMenu
                                title="Configuration"
                                renderIcon={SettingsAdjust}
                                isActive={isActive('/configuration') || isActive('/runbooks')}
                            >
                                <SideNavLink
                                    as={Link}
                                    to="/configuration"
                                    isActive={isActive('/configuration')}
                                >
                                    Alert Configuration
                                </SideNavLink>
                                <SideNavLink
                                    as={Link}
                                    to="/runbooks"
                                    isActive={isActive('/runbooks')}
                                >
                                    Runbooks
                                </SideNavLink>
                            </SideNavMenu>

                            {/* ========================================
                                ADMINISTRATION (sysadmin only)
                               ======================================== */}
                            {currentRole.id === 'sysadmin' && (
                                <SideNavMenu
                                    title="Administration"
                                    renderIcon={Security}
                                    isActive={isActive('/admin')}
                                >
                                    <SideNavLink
                                        as={Link}
                                        to="/admin/audit-log"
                                        isActive={isActive('/admin/audit-log')}
                                    >
                                        Audit Log
                                    </SideNavLink>
                                </SideNavMenu>
                            )}

                            {/* ========================================
                                Bottom Section - Settings & Profile
                               ======================================== */}
                            <SideNavLink
                                as={Link}
                                to="/settings"
                                renderIcon={Settings}
                                isActive={isActive('/settings')}
                            >
                                Settings
                            </SideNavLink>

                            <SideNavLink
                                as={Link}
                                to="/profile"
                                renderIcon={UserAvatar}
                                isActive={isActive('/profile')}
                            >
                                Profile
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
