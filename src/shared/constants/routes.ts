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
    SETTINGS: '/settings',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];
