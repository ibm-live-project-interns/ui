/**
 * NotificationPanel Component
 *
 * Dropdown notification panel showing recent critical/major alerts.
 * Extracted from AppHeader to reduce component size.
 *
 * Features:
 * - Severity-colored indicators and Carbon Tags
 * - Relative time formatting (e.g., "2 min ago")
 * - Mark-all-as-read functionality
 * - Click-to-navigate to individual alert details
 * - Click outside to close
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeaderGlobalAction, Tag } from '@carbon/react';
import {
    Notification,
    CheckmarkOutline,
    CheckmarkFilled,
} from '@carbon/icons-react';
import type { PriorityAlert } from '@/features/alerts/types';
import { SEVERITY_COLORS } from '@/shared/constants/colors';

// ==========================================
// Types
// ==========================================

/**
 * Notification alert shape for the dropdown.
 * Extends PriorityAlert with optional fallback fields that may exist
 * in API responses but are not part of the transformed PriorityAlert type.
 */
export interface NotificationAlert extends PriorityAlert {
    /** Fallback: raw alert title from API */
    title?: string;
    /** Fallback: raw alert description from API */
    description?: string;
    /** Fallback: alert source device name */
    source?: string;
    /** Fallback: raw created_at timestamp from API */
    created_at?: string;
}

interface NotificationPanelProps {
    notifications: NotificationAlert[];
    onMarkAllRead: () => void;
}

// ==========================================
// Helpers
// ==========================================

/**
 * Format a timestamp as a relative time string (e.g., "2 min ago", "1 hr ago").
 */
function formatRelativeTime(dateStr?: string): string {
    if (!dateStr) return 'Just now';

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) return 'Just now';

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
}

/**
 * Map severity to Carbon Tag type
 */
function severityToTagType(severity?: string): 'red' | 'magenta' | 'orange' | 'blue' | 'gray' {
    switch (severity?.toLowerCase()) {
        case 'critical': return 'red';
        case 'high':
        case 'major': return 'magenta';
        case 'medium':
        case 'warning': return 'orange';
        case 'low':
        case 'info': return 'blue';
        default: return 'gray';
    }
}

// ==========================================
// Component
// ==========================================

const NotificationPanel = React.memo(function NotificationPanel({
    notifications,
    onMarkAllRead,
}: NotificationPanelProps) {
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

    const handleMarkAllRead = () => {
        onMarkAllRead();
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
                    <span className="notification-badge">
                        {notifications.length > 99 ? '99+' : notifications.length}
                    </span>
                )}
            </HeaderGlobalAction>

            {isOpen && (
                <div className="notification-dropdown" role="region" aria-label="Notification panel">
                    <div className="notification-dropdown-header">
                        <span className="notification-dropdown-title">Notifications</span>
                        {notifications.length > 0 ? (
                            <button
                                className="notification-dropdown-mark-read"
                                onClick={handleMarkAllRead}
                                aria-label="Mark all as read"
                            >
                                <CheckmarkFilled size={14} />
                                Mark all read
                            </button>
                        ) : (
                            <span className="notification-dropdown-count">0 new</span>
                        )}
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
                                        style={{ '--indicator-color': getSeverityColor(alert.severity) } as React.CSSProperties}
                                    />
                                    <div className="notification-content">
                                        <span className="notification-title">
                                            {alert.aiTitle || alert.title || alert.description || 'Alert'}
                                        </span>
                                        <span className="notification-device">
                                            <Tag
                                                type={severityToTagType(alert.severity)}
                                                size="sm"
                                                className="u-icon-inline"
                                            >
                                                {alert.severity || 'unknown'}
                                            </Tag>
                                            {alert.source || (typeof alert.device === 'string' ? alert.device : alert.device?.name) || 'Unknown Device'}
                                        </span>
                                        <span className="notification-relative-time">
                                            {formatRelativeTime(
                                                typeof alert.timestamp === 'object' && alert.timestamp?.absolute
                                                    ? alert.timestamp.absolute
                                                    : alert.created_at || alert.timestamp
                                            )}
                                        </span>
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
});

export { NotificationPanel };
export default NotificationPanel;
