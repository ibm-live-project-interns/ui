/**
 * Sidebar Navigation Configuration
 *
 * Defines the sidebar navigation structure for AppHeader.
 * Extracted to reduce AppHeader.tsx line count and make navigation
 * changes easier to manage in a single declarative location.
 */

import {
    Dashboard,
    Devices,
    ChartLine,
    SettingsAdjust,
    Settings,
    UserAvatar,
    Security,
} from '@carbon/icons-react';
import type { CarbonIconType } from '@carbon/icons-react';
import type { Permission } from '@/features/roles/types/role.types';

// ==========================================
// Sidebar Type Definitions
// ==========================================

/** Badge type determines which dynamic count to display on a nav item. */
export type BadgeType = 'alert-count' | 'ticket-count';

/** Configuration for a badge displayed on a sidebar nav item. */
export interface BadgeConfig {
    type: BadgeType;
    /** Carbon Tag color variant */
    tagType: 'red' | 'magenta' | 'orange' | 'blue' | 'gray';
}

/** A single navigation link within a sidebar group. */
export interface SidebarItem {
    label: string;
    path: string;
    /** Permission required to see this item. Omit for no restriction. */
    permission?: Permission;
    /** Badge to display next to the label when count > 0. */
    badge?: BadgeConfig;
    /**
     * Custom active-state check. When provided, this function is called
     * instead of the default `isActive(path)` check.
     * Receives the `isActive` helper as an argument.
     */
    isActiveFn?: (isActive: (path: string) => boolean) => boolean;
}

/** A collapsible group of navigation links in the sidebar. */
export interface SidebarGroup {
    label: string;
    icon: CarbonIconType;
    items: SidebarItem[];
    /** Whether this group is expanded by default. */
    defaultExpanded?: boolean;
    /** Permission required to see this entire group. Omit for no restriction. */
    permission?: Permission;
    /** Role ID required to see this group (stricter than permission). */
    roleRestriction?: string;
}

/** A standalone navigation link (not inside a group). */
export interface SidebarStandaloneLink {
    label: string;
    path: string;
    icon: CarbonIconType;
}

// ==========================================
// Sidebar Groups Configuration
// ==========================================

export const sidebarGroups: SidebarGroup[] = [
    // --- Operations ---
    {
        label: 'Operations',
        icon: Dashboard,
        defaultExpanded: true,
        items: [
            {
                label: 'Dashboard',
                path: '/dashboard',
            },
            {
                label: 'Priority Alerts',
                path: '/priority-alerts',
                permission: 'view-alerts',
                badge: { type: 'alert-count', tagType: 'red' },
            },
            {
                label: 'Tickets',
                path: '/tickets',
                permission: 'view-tickets',
                badge: { type: 'ticket-count', tagType: 'magenta' },
            },
            {
                label: 'On-Call Schedule',
                path: '/on-call',
            },
            {
                label: 'Service Status',
                path: '/service-status',
            },
        ],
    },

    // --- Infrastructure ---
    {
        label: 'Infrastructure',
        icon: Devices,
        defaultExpanded: true,
        permission: 'view-devices',
        items: [
            {
                label: 'Devices',
                path: '/devices',
            },
            {
                label: 'Network Topology',
                path: '/topology',
            },
            {
                label: 'Device Groups',
                path: '/device-groups',
            },
        ],
    },

    // --- Analytics ---
    {
        label: 'Analytics',
        icon: ChartLine,
        defaultExpanded: true,
        permission: 'view-analytics',
        items: [
            {
                label: 'Trends & Insights',
                path: '/trends',
            },
            {
                label: 'Incident History',
                path: '/incident-history',
            },
            {
                label: 'Post-Mortems',
                path: '/incidents/post-mortems',
            },
            {
                label: 'SLA Reports',
                path: '/reports/sla',
            },
            {
                label: 'Reports',
                path: '/reports',
                isActiveFn: (isActive) => isActive('/reports') && !isActive('/reports/sla'),
            },
        ],
    },

    // --- Configuration ---
    {
        label: 'Configuration',
        icon: SettingsAdjust,
        items: [
            {
                label: 'Alert Configuration',
                path: '/configuration',
            },
            {
                label: 'Runbooks',
                path: '/runbooks',
            },
        ],
    },

    // --- Administration (sysadmin only) ---
    {
        label: 'Administration',
        icon: Security,
        roleRestriction: 'sysadmin',
        items: [
            {
                label: 'Audit Log',
                path: '/admin/audit-log',
            },
        ],
    },
];

// ==========================================
// Standalone Bottom Links
// ==========================================

export const sidebarBottomLinks: SidebarStandaloneLink[] = [
    {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
    },
    {
        label: 'Profile',
        path: '/profile',
        icon: UserAvatar,
    },
];
