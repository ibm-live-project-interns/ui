/**
 * Route Constants
 *
 * Application route paths.
 */

export const ROUTES = {
    // Auth routes
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',

    // Main routes
    WELCOME: '/welcome',
    DASHBOARD: '/dashboard',
    PRIORITY_ALERTS: '/priority-alerts',
    ALERTS: '/alerts',
    ALERT_DETAILS: '/alerts/:id',
    TICKETS: '/tickets',
    TICKET_DETAILS: '/tickets/:id',
    DEVICES: '/devices',
    DEVICE_DETAILS: '/devices/:id',
    TRENDS: '/trends',
    INCIDENT_HISTORY: '/incident-history',
    CONFIGURATION: '/configuration',
    SETTINGS: '/settings',
    PROFILE: '/profile',
    AUDIT_LOG: '/admin/audit-log',
    REPORTS: '/reports',
    SLA_REPORTS: '/reports/sla',
    ON_CALL: '/on-call',
    TOPOLOGY: '/topology',
    RUNBOOKS: '/runbooks',
    SERVICE_STATUS: '/service-status',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];
