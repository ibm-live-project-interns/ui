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
import { Search as SearchIcon } from '@carbon/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

/**
 * AppHeader Component - Carbon UI Shell
 *
 * Implements the Carbon UI Shell pattern with responsive SideNav:
 * - Sidebar expanded by default on desktop
 * - Collapses to hamburger menu overlay on mobile
 * - Uses React Router Link for seamless client-side navigation
 * - User profile at bottom with logout option sliding up
 * - Global search modal with Cmd/Ctrl+K shortcut
 * - Notification dropdown with real alert data
 *
 * Sub-components extracted for maintainability:
 * - NotificationPanel: bell icon + dropdown with alert list
 * - SidebarUserSection: bottom user profile area with logout
 *
 * @see https://carbondesignsystem.com/components/UI-shell-header/usage/
 */

// Alert count and auth services
import { alertDataService, ticketDataService } from '@/shared/services';
import type { PriorityAlert } from '@/features/alerts/types';
import { logger } from '@/shared/utils/logger';
import { useRole } from '@/features/roles/hooks';
import { env } from '@/shared/config';
import { GlobalSearch, useGlobalSearchShortcut } from './GlobalSearch';
import { sidebarGroups, sidebarBottomLinks } from './sidebarConfig';
import type { BadgeType } from './sidebarConfig';
import { NotificationPanel } from './NotificationPanel';
import type { NotificationAlert } from './NotificationPanel';
import { SidebarUserSection } from './SidebarUserSection';

export function AppHeader() {
    const location = useLocation();
    const [alertCount, setAlertCount] = useState(0);
    const [criticalTicketCount, setCriticalTicketCount] = useState(0);
    // Shared notification alerts -- single polling source to avoid duplicate API calls
    const [notificationAlerts, setNotificationAlerts] = useState<NotificationAlert[]>([]);
    // Dismissed notification IDs (persisted in session to survive re-renders)
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
        try {
            const stored = sessionStorage.getItem('dismissed_notification_ids');
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });
    const { hasPermission, currentRole } = useRole();

    // Global search state (Cmd/Ctrl+K shortcut)
    const [isSearchOpen, setIsSearchOpen] = useGlobalSearchShortcut();

    // Filter notifications to exclude dismissed ones
    const visibleNotifications = notificationAlerts.filter(a => !dismissedIds.has(a.id));

    // Mark all notifications as read
    const handleMarkAllRead = () => {
        const newDismissed = new Set(dismissedIds);
        notificationAlerts.forEach(a => newDismissed.add(a.id));
        setDismissedIds(newDismissed);
        try {
            sessionStorage.setItem('dismissed_notification_ids', JSON.stringify([...newDismissed]));
        } catch {
            // sessionStorage may be unavailable
        }
    };

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
                logger.debug('Alert count fetch skipped', error);
            }

            // Fetch recent unacknowledged/critical alerts for notification dropdown
            try {
                const alerts = await alertDataService.getAlerts();
                // Prioritize critical/major, unacknowledged alerts
                const prioritized = (alerts as (PriorityAlert & NotificationAlert)[])
                    .filter((a) => a.status === 'open' || a.status === 'active')
                    .sort((a, b) => {
                        const severityOrder: Record<string, number> = {
                            critical: 0, high: 1, major: 1, medium: 2, warning: 2, low: 3, info: 4,
                        };
                        return (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5);
                    })
                    .slice(0, 10);
                setNotificationAlerts(prioritized);
            } catch (error) {
                logger.debug('Notification alerts fetch skipped', error);
            }

            try {
                const tickets = await ticketDataService.getTickets();
                const criticalCount = tickets.filter(
                    t => (t.priority === 'critical' || t.priority === 'high') &&
                        (t.status === 'open' || t.status === 'in-progress')
                ).length;
                setCriticalTicketCount(criticalCount);
            } catch (error) {
                logger.debug('Ticket count fetch skipped', error);
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

    // Resolve badge count by type for sidebar nav items
    const getBadgeCount = (type: BadgeType): number => {
        switch (type) {
            case 'alert-count': return alertCount;
            case 'ticket-count': return criticalTicketCount;
            default: return 0;
        }
    };

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

                    {/* Global Bar - Search and Notifications */}
                    <HeaderGlobalBar>
                        {/* Search Button - Opens Global Search Modal (also via Cmd/Ctrl+K) */}
                        <HeaderGlobalAction
                            aria-label="Search (Ctrl+K)"
                            onClick={() => setIsSearchOpen(true)}
                        >
                            <SearchIcon size={20} />
                        </HeaderGlobalAction>

                        {/* Notifications Dropdown */}
                        <NotificationPanel
                            notifications={visibleNotifications}
                            onMarkAllRead={handleMarkAllRead}
                        />
                    </HeaderGlobalBar>

                    {/* Global Search Modal */}
                    <GlobalSearch
                        isOpen={isSearchOpen}
                        onClose={() => setIsSearchOpen(false)}
                    />

                    <SideNav
                        aria-label="Side navigation"
                        expanded={isSideNavExpanded}
                        onOverlayClick={onClickSideNavExpand}
                        onSideNavBlur={onClickSideNavExpand}
                        isChildOfHeader
                    >
                        <SideNavItems>
                            {sidebarGroups.map((group) => {
                                // Check role restriction
                                if (group.roleRestriction && currentRole.id !== group.roleRestriction) {
                                    return null;
                                }
                                // Check group-level permission
                                if (group.permission && !hasPermission(group.permission)) {
                                    return null;
                                }

                                // Compute group active state from child paths
                                const groupIsActive = group.items.some(
                                    (item) => isActive(item.path)
                                );

                                return (
                                    <SideNavMenu
                                        key={group.label}
                                        title={group.label}
                                        renderIcon={group.icon}
                                        defaultExpanded={group.defaultExpanded}
                                        isActive={groupIsActive}
                                    >
                                        {group.items.map((item) => {
                                            // Check item-level permission
                                            if (item.permission && !hasPermission(item.permission)) {
                                                return null;
                                            }

                                            const itemIsActive = item.isActiveFn
                                                ? item.isActiveFn(isActive)
                                                : isActive(item.path);

                                            const badgeCount = item.badge
                                                ? getBadgeCount(item.badge.type)
                                                : 0;

                                            return (
                                                <SideNavLink
                                                    key={item.path}
                                                    as={Link}
                                                    to={item.path}
                                                    isActive={itemIsActive}
                                                    className={badgeCount > 0 ? 'sidenav-link-with-badge' : ''}
                                                >
                                                    {badgeCount > 0 && item.badge ? (
                                                        <>
                                                            <span className="sidenav-link-text">{item.label}</span>
                                                            <Tag type={item.badge.tagType} size="sm" className="sidenav-alert-badge">
                                                                {badgeCount}
                                                            </Tag>
                                                        </>
                                                    ) : (
                                                        item.label
                                                    )}
                                                </SideNavLink>
                                            );
                                        })}
                                    </SideNavMenu>
                                );
                            })}

                            {/* Bottom Section - Settings & Profile */}
                            {sidebarBottomLinks.map((link) => (
                                <SideNavLink
                                    key={link.path}
                                    as={Link}
                                    to={link.path}
                                    renderIcon={link.icon}
                                    isActive={isActive(link.path)}
                                >
                                    {link.label}
                                </SideNavLink>
                            ))}
                        </SideNavItems>

                        {/* User Profile Footer */}
                        <SidebarUserSection />
                    </SideNav>
                </Header>
            )}
        />
    );
}

export default AppHeader;
