/**
 * Role Configuration
 *
 * Defines the dashboard configuration for each user role.
 * Uses ROLE_NAMES from shared types to avoid duplication.
 */

import type { RoleConfig, Role } from '../types';
import { ROLE_NAMES, type RoleID } from '@/shared/types';

// ==========================================
// Role Descriptions (not in ROLE_NAMES)
// ==========================================

const ROLE_DESCRIPTIONS: Record<RoleID, string> = {
    'network-ops': 'Focus on real-time alerts and incident response',
    'sre': 'Focus on system reliability and SLA compliance',
    'network-admin': 'Focus on device management and infrastructure',
    'senior-eng': 'High-level overview and pattern analysis',
    'sysadmin': 'Full system access and configuration control',
};

// ==========================================
// Available Roles (derived from shared ROLE_NAMES)
// ==========================================

export const ROLES: Record<RoleID, Role> = Object.fromEntries(
    (Object.keys(ROLE_NAMES) as RoleID[]).map(id => [
        id,
        {
            id,
            name: ROLE_NAMES[id],
            description: ROLE_DESCRIPTIONS[id],
        }
    ])
) as Record<RoleID, Role>;

// ==========================================
// Role Configurations
// ==========================================

export const ROLE_CONFIGS: Record<RoleID, RoleConfig> = {
    'network-ops': {
        id: 'network-ops',
        name: ROLE_NAMES['network-ops'],
        description: ROLE_DESCRIPTIONS['network-ops'],
        dashboardView: 'network-ops',
        kpis: [
            { id: 'active-alerts', label: 'Active Alerts', priority: 1 },
            { id: 'critical-count', label: 'Critical', priority: 2 },
            { id: 'acknowledged', label: 'Acknowledged', priority: 3 },
            { id: 'mttr', label: 'Avg Response Time', priority: 4 },
        ],
        charts: [
            { id: 'alerts-over-time', type: 'area', title: 'Alerts Over Time' },
            { id: 'severity-distribution', type: 'donut', title: 'By Severity' },
        ],
        tables: [
            {
                id: 'recent-alerts',
                title: 'Recent Alerts',
                columns: ['timestamp', 'device', 'severity', 'summary', 'status', 'actions'],
            },
        ],
        widgets: [
            { id: 'critical-ticker', position: 'top' },
            { id: 'noisy-devices', position: 'bottom' },
            { id: 'ai-metrics', position: 'bottom' },
        ],
        sidebarItems: ['dashboard', 'priority-alerts', 'alerts', 'tickets', 'trends', 'settings'],
        permissions: ['view-alerts', 'acknowledge-alerts', 'create-tickets', 'view-tickets', 'export-reports'],
    },

    'sre': {
        id: 'sre',
        name: ROLE_NAMES['sre'],
        description: ROLE_DESCRIPTIONS['sre'],
        dashboardView: 'sre',
        kpis: [
            { id: 'uptime', label: 'Uptime', priority: 1 },
            { id: 'mttr', label: 'MTTR', priority: 2 },
            { id: 'sla-compliance', label: 'SLA Compliance', priority: 3 },
            { id: 'error-rate', label: 'Error Rate', priority: 4 },
        ],
        charts: [
            { id: 'reliability-trends', type: 'line', title: 'Reliability Trends' },
            { id: 'sla-compliance', type: 'gauge', title: 'SLA Compliance' },
        ],
        tables: [
            {
                id: 'recent-incidents',
                title: 'Recent Incidents',
                columns: ['timestamp', 'service', 'duration', 'impact', 'resolution'],
            },
        ],
        widgets: [
            { id: 'system-health', position: 'top' },
            { id: 'deployment-impact', position: 'bottom' },
        ],
        sidebarItems: ['dashboard', 'incidents', 'services', 'sla-reports', 'trends', 'settings'],
        permissions: ['view-alerts', 'view-services', 'view-sla', 'export-reports'],
    },

    'network-admin': {
        id: 'network-admin',
        name: ROLE_NAMES['network-admin'],
        description: ROLE_DESCRIPTIONS['network-admin'],
        dashboardView: 'network-admin',
        kpis: [
            { id: 'total-devices', label: 'Total Devices', priority: 1 },
            { id: 'online-devices', label: 'Online', priority: 2 },
            { id: 'offline-devices', label: 'Offline', priority: 3 },
            { id: 'capacity', label: 'Capacity Used', priority: 4 },
        ],
        charts: [
            { id: 'device-status', type: 'bar', title: 'Device Status' },
            { id: 'bandwidth-usage', type: 'area', title: 'Bandwidth Usage' },
        ],
        tables: [
            {
                id: 'device-list',
                title: 'Devices',
                columns: ['name', 'ip', 'status', 'model', 'lastSeen', 'alerts', 'actions'],
            },
        ],
        widgets: [
            { id: 'infrastructure-health', position: 'top' },
            { id: 'maintenance-schedule', position: 'bottom' },
        ],
        sidebarItems: ['dashboard', 'devices', 'topology', 'configuration', 'alerts', 'settings'],
        permissions: ['view-devices', 'manage-devices', 'view-config', 'view-alerts'],
    },

    'senior-eng': {
        id: 'senior-eng',
        name: ROLE_NAMES['senior-eng'],
        description: ROLE_DESCRIPTIONS['senior-eng'],
        dashboardView: 'senior-eng',
        kpis: [
            { id: 'total-alerts-week', label: 'Alerts (7d)', priority: 1 },
            { id: 'resolution-rate', label: 'Resolution Rate', priority: 2 },
            { id: 'pattern-detection', label: 'Patterns Detected', priority: 3 },
            { id: 'ai-accuracy', label: 'AI Accuracy', priority: 4 },
        ],
        charts: [
            { id: 'trend-analysis', type: 'line', title: 'Trend Analysis' },
            { id: 'pattern-heatmap', type: 'bar', title: 'Pattern Distribution' },
        ],
        tables: [
            {
                id: 'issues-overview',
                title: 'Issues Overview',
                columns: ['category', 'count', 'trend', 'priority', 'actions'],
            },
        ],
        widgets: [
            { id: 'analytics-summary', position: 'top' },
            { id: 'team-metrics', position: 'bottom' },
        ],
        sidebarItems: ['dashboard', 'trends', 'alerts', 'devices', 'settings'],
        permissions: ['view-all', 'view-analytics', 'export-reports', 'view-team-metrics'],
    },

    'sysadmin': {
        id: 'sysadmin',
        name: ROLE_NAMES['sysadmin'],
        description: ROLE_DESCRIPTIONS['sysadmin'],
        dashboardView: 'sysadmin',
        kpis: [
            { id: 'total-devices', label: 'Total Devices', priority: 1 },
            { id: 'active-alerts', label: 'Active Alerts', priority: 2 },
            { id: 'system-health', label: 'System Health', priority: 3 },
            { id: 'capacity', label: 'Capacity', priority: 4 },
        ],
        charts: [
            { id: 'alerts-over-time', type: 'area', title: 'System Load' },
            { id: 'compliance-overview', type: 'donut', title: 'Compliance Status' },
        ],
        tables: [
            {
                id: 'recent-activity',
                title: 'System Activity',
                columns: ['timestamp', 'user', 'action', 'resource', 'status'],
            },
        ],
        widgets: [
            { id: 'top-interfaces', position: 'top' },
            { id: 'config-audit-log', position: 'bottom' },
        ],
        sidebarItems: ['dashboard', 'priority-alerts', 'trends', 'devices', 'tickets', 'configuration', 'settings'],
        permissions: [
            'view-alerts', 'acknowledge-alerts', 'create-tickets', 'view-tickets',
            'view-devices', 'manage-devices', 'view-config',
            'view-analytics', 'export-reports',
            'view-services', 'view-sla',
            'view-team-metrics', 'view-all'
        ],
    },
};

// ==========================================
// Helper Functions
// ==========================================

export function getRoleConfig(roleId: RoleID | string): RoleConfig {
    return ROLE_CONFIGS[roleId as RoleID] || ROLE_CONFIGS['network-ops'];
}

export function getRolesList(): Role[] {
    return Object.values(ROLES);
}
