/**
 * Copyright IBM Corp. 2026
 *
 * Shared types and constants for Settings page components.
 */

import {
    Email,
    Notification,
    VolumeUp,
    Events,
} from '@carbon/icons-react';

// ==========================================
// Types
// ==========================================

export type ThemeSetting = 'system' | 'light' | 'dark';

export interface NotificationSettings {
    emailAlerts: boolean;
    pushNotifications: boolean;
    soundEnabled: boolean;
    criticalOnly: boolean;
}

export type NotificationKey = keyof NotificationSettings;

export interface GeneralSettings {
    language: string;
    timezone: string;
    autoRefresh: boolean;
    refreshInterval: string;
}

export interface SettingsState {
    theme: ThemeSetting;
    notifications: NotificationSettings;
    general: GeneralSettings;
}

export interface NotificationOption {
    key: NotificationKey;
    label: string;
    desc: string;
    icon: typeof Email;
    comingSoon?: boolean;
}

// ==========================================
// Constants
// ==========================================

/** localStorage key for the auto-refresh enabled flag */
export const AUTO_REFRESH_KEY = 'settings_autoRefresh';
/** localStorage key for the auto-refresh interval in seconds */
export const REFRESH_INTERVAL_KEY = 'settings_refreshInterval';

export const GENERAL_OPTS = {
    languages: [
        { value: 'en', text: 'English' },
        { value: 'es', text: 'Espa\u00f1ol' },
        { value: 'fr', text: 'Fran\u00e7ais' },
        { value: 'de', text: 'Deutsch' },
        { value: 'ja', text: '\u65e5\u672c\u8a9e' },
        { value: 'zh', text: '\u4e2d\u6587' },
    ],
    timezones: [
        { value: 'UTC', text: 'UTC' },
        { value: 'America/New_York', text: 'Eastern Time (ET)' },
        { value: 'America/Chicago', text: 'Central Time (CT)' },
        { value: 'America/Denver', text: 'Mountain Time (MT)' },
        { value: 'America/Los_Angeles', text: 'Pacific Time (PT)' },
        { value: 'Europe/London', text: 'London (GMT/BST)' },
        { value: 'Europe/Paris', text: 'Paris (CET/CEST)' },
        { value: 'Asia/Tokyo', text: 'Tokyo (JST)' },
        { value: 'Asia/Kolkata', text: 'India (IST)' },
    ],
    intervals: [
        { value: '10', text: 'Every 10 seconds' },
        { value: '30', text: 'Every 30 seconds' },
        { value: '60', text: 'Every 1 minute' },
        { value: '300', text: 'Every 5 minutes' },
        { value: '600', text: 'Every 10 minutes' },
    ],
};

export const NOTIFICATION_OPTS: NotificationOption[] = [
    { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive alert notifications via email', icon: Email },
    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive browser push notifications', icon: Notification },
    { key: 'soundEnabled', label: 'Sound Effects', desc: 'Play sound for new alerts (Coming soon)', icon: VolumeUp, comingSoon: true },
    { key: 'criticalOnly', label: 'Critical Alerts Only', desc: 'Only notify for critical severity alerts', icon: Events },
];

export const DEFAULT_SETTINGS: SettingsState = {
    theme: 'system',
    notifications: { emailAlerts: true, pushNotifications: true, soundEnabled: false, criticalOnly: false },
    general: { language: 'en', timezone: 'UTC', autoRefresh: true, refreshInterval: '30' },
};
