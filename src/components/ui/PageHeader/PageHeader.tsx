/**
 * Copyright IBM Corp. 2026
 *
 * PageHeader Component
 * Displays a consistent page header with breadcrumbs, title, badges, tabs, and action buttons
 * Highly configurable for different page layouts
 */

import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@carbon/react';
import { ChevronRight } from '@carbon/icons-react';
import './PageHeader.scss';

export interface Breadcrumb {
    /** Display text */
    label: string;
    /** Navigation href (omit for current/active page) */
    href?: string;
    /** Whether this is the current page */
    active?: boolean;
}

export interface PageBadge {
    /** Badge text */
    text: string;
    /** Badge color (hex or CSS color) */
    color?: string;
    /** Badge variant */
    variant?: 'filled' | 'outline';
}

export interface PageAction {
    /** Button label */
    label: string;
    /** Button icon */
    icon?: React.ComponentType<{ size?: number }>;
    /** Button variant */
    variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
    /** Click handler */
    onClick: () => void;
    /** Whether button is disabled */
    disabled?: boolean;
    /** Show loading state */
    loading?: boolean;
    /** Tooltip/description */
    tooltip?: string;
}

export interface PageTab {
    /** Tab label */
    label: string;
    /** Tab value/id */
    value: string;
}

export interface PageHeaderProps {
    /** Breadcrumb navigation items */
    breadcrumbs?: Breadcrumb[];
    /** Whether to show breadcrumbs */
    showBreadcrumbs?: boolean;
    /** Page title */
    title: string;
    /** Whether to show title */
    showTitle?: boolean;
    /** Optional subtitle/description */
    subtitle?: string;
    /** Whether to show subtitle */
    showSubtitle?: boolean;
    /** Status badges next to title */
    badges?: PageBadge[];
    /** Action buttons (right side) */
    actions?: PageAction[];
    /** Tabs below title */
    tabs?: PageTab[];
    /** Currently selected tab */
    selectedTab?: string;
    /** Tab change handler */
    onTabChange?: (tabValue: string) => void;
    /** Whether to show bottom border */
    showBorder?: boolean;
    /** Additional content to the right of title (e.g., date picker) */
    rightContent?: React.ReactNode;
    /** Additional content below subtitle (before border) */
    bottomContent?: React.ReactNode;
    /** Whether this is a compact header */
    compact?: boolean;
    /** Additional class name */
    className?: string;
}

/**
 * PageHeader - Highly configurable header pattern for all pages
 *
 * Features:
 * - Breadcrumb navigation (hideable)
 * - Title with badges
 * - Subtitle/description
 * - Multiple action buttons (right side)
 * - Tabs (optional)
 * - Bottom border (optional)
 * - Custom right content (date pickers, etc.)
 * - Compact mode
 *
 * @example
 * ```tsx
 * // Alert Detail Page
 * <PageHeader
 *   breadcrumbs={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Alert #ALT-2023-8842', active: true }
 *   ]}
 *   title="High CPU Utilization (98%) on Module 4"
 *   badges={[
 *     { text: 'Critical', color: '#da1e28' },
 *     { text: 'Open', color: '#ff832b', variant: 'outline' }
 *   ]}
 *   actions={[
 *     { label: 'Suppress', icon: Notification, variant: 'secondary', onClick: handleSuppress },
 *     { label: 'Create Ticket', icon: Task, variant: 'secondary', onClick: handleTicket },
 *     { label: 'Acknowledge', icon: Checkmark, variant: 'primary', onClick: handleAck }
 *   ]}
 *   showBorder
 * />
 *
 * // Alert Configuration Page
 * <PageHeader
 *   breadcrumbs={[{ label: 'Configuration' }, { label: 'Alert Rules', active: true }]}
 *   title="Alert Configuration"
 *   tabs={[
 *     { label: 'Threshold Rules', value: 'threshold' },
 *     { label: 'Notification Channels', value: 'notification' },
 *     { label: 'Escalation Policies', value: 'escalation' },
 *     { label: 'Maintenance Windows', value: 'maintenance' }
 *   ]}
 *   selectedTab="threshold"
 *   onTabChange={setActiveTab}
 *   showBorder
 * />
 *
 * // Incident History Page
 * <PageHeader
 *   breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Trends', href: '/trends' }, { label: 'Incident History', active: true }]}
 *   title="Incident History & Resolution"
 *   subtitle="Historical analysis of resolved alerts, root causes, and post-mortem actions."
 *   rightContent={<DatePicker />}
 *   actions={[{ label: 'Export Report', icon: Download, variant: 'primary', onClick: handleExport }]}
 *   showBorder
 * />
 * ```
 */
export function PageHeader({
    breadcrumbs,
    showBreadcrumbs = true,
    title,
    showTitle = true,
    subtitle,
    showSubtitle = true,
    badges,
    actions,
    tabs,
    selectedTab,
    onTabChange,
    showBorder = false,
    rightContent,
    bottomContent,
    compact = false,
    className = '',
}: PageHeaderProps) {
    const handleTabChange = (event: { index: number; name: string; text: string }) => {
        if (onTabChange && tabs?.[event.index]) {
            onTabChange(tabs[event.index].value);
        }
    };



    return (
        <header className={`page-header ${compact ? 'page-header--compact' : ''} ${showBorder ? 'page-header--bordered' : ''} ${className}`}>
            {/* Breadcrumbs */}
            {showBreadcrumbs && breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="page-header__breadcrumbs" aria-label="Breadcrumb">
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={crumb.label}>
                            {index > 0 && (
                                <ChevronRight size={12} className="page-header__breadcrumb-separator" />
                            )}
                            {crumb.href && !crumb.active ? (
                                <Link
                                    to={crumb.href}
                                    className="page-header__breadcrumb-link"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span
                                    className={`page-header__breadcrumb-text ${crumb.active ? 'page-header__breadcrumb-text--active' : ''}`}
                                >
                                    {crumb.label}
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}

            {/* Main header row */}
            <div className="page-header__main">
                <div className="page-header__title-section">
                    {showTitle && (
                        <div className="page-header__title-row">
                            <h1 className="page-header__title">{title}</h1>
                            {badges && badges.length > 0 && (
                                <div className="page-header__badges">
                                    {badges.map((badge, index) => (
                                        <span
                                            key={index}
                                            className={`page-header__badge page-header__badge--${badge.variant || 'filled'}`}
                                            style={{
                                                backgroundColor: badge.variant === 'outline' ? 'transparent' : badge.color,
                                                borderColor: badge.color,
                                                color: badge.variant === 'outline' ? badge.color : '#ffffff',
                                            }}
                                        >
                                            {badge.text}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {showSubtitle && subtitle && (
                        <p className="page-header__subtitle">{subtitle}</p>
                    )}
                </div>

                {/* Right section: actions and custom content */}
                <div className="page-header__right">
                    {rightContent && (
                        <div className="page-header__right-content">
                            {rightContent}
                        </div>
                    )}
                    {actions && actions.length > 0 && (
                        <div className="page-header__actions">
                            {actions.map((action, index) => (
                                <Button
                                    key={index}
                                    kind={action.variant || 'secondary'}
                                    renderIcon={action.icon}
                                    onClick={action.onClick}
                                    disabled={action.disabled || action.loading}
                                    size="md"
                                    title={action.tooltip}
                                >
                                    {action.loading ? 'Loading...' : action.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom content (before tabs/border) */}
            {bottomContent && (
                <div className="page-header__bottom-content">
                    {bottomContent}
                </div>
            )}

            {/* Tabs */}
            {tabs && tabs.length > 0 && (
                <div className="page-header__tabs">
                    <div className="page-header__tab-list" role="tablist">
                        {tabs.map((tab, index) => {
                            const isSelected = tab.value === selectedTab || (!selectedTab && index === 0);
                            return (
                                <button
                                    key={tab.value}
                                    className={`page-header__tab ${isSelected ? 'page-header__tab--selected' : ''}`}
                                    role="tab"
                                    aria-selected={isSelected}
                                    tabIndex={isSelected ? 0 : -1}
                                    onClick={() => handleTabChange({ index: index, name: tab.value, text: tab.label })}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </header>
    );
}

export default PageHeader;
