/**
 * Copyright IBM Corp. 2026
 *
 * useSettings - Custom hook encapsulating all state, persistence,
 * and mutation logic for the Settings page.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/features/roles/hooks';
import type { RoleId } from '@/features/roles/types';
import { env, API_ENDPOINTS } from '@/shared/config';
import { useToast } from '@/contexts';
import { logger } from '@/shared/utils/logger';

import {
    AUTO_REFRESH_KEY,
    REFRESH_INTERVAL_KEY,
    DEFAULT_SETTINGS,
} from './settings.types';
import type {
    ThemeSetting,
    NotificationKey,
    GeneralSettings,
    SettingsState,
} from './settings.types';

// ==========================================
// Return type
// ==========================================

export interface UseSettingsReturn {
    // Settings state
    settings: SettingsState;

    // Tabs
    selectedTab: number;
    handleTabChange: (val: string) => void;

    // Theme
    updateTheme: (val: ThemeSetting) => void;

    // Notifications
    updateNotification: (key: NotificationKey, val: boolean) => void;

    // General
    updateGeneral: <K extends keyof GeneralSettings>(key: K, val: GeneralSettings[K]) => void;

    // Role
    currentRoleId: string;
    setRole: (role: RoleId) => void;

    // Save
    save: () => Promise<void>;
}

// ==========================================
// Tab value constants (used for index lookup)
// ==========================================

const TAB_VALUES = ['general', 'preferences', 'notifications'] as const;

// ==========================================
// Hook
// ==========================================

export function useSettings(): UseSettingsReturn {
    const navigate = useNavigate();
    const { currentRole, setRole: setRoleInContext } = useRole();
    const [selectedTab, setSelectedTab] = useState(0);
    const { addToast } = useToast();

    // Track whether the backend notification save failed, so we can avoid
    // showing a misleading "success" toast after a partial save.
    const backendSaveFailedRef = useRef(false);

    // State
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

    // Load notification preferences from backend
    const loadNotificationPreferences = useCallback(async () => {
        try {
            const token = localStorage.getItem('noc_token');
            if (!token) return;
            const resp = await fetch(`${env.apiBaseUrl}/api/${env.apiVersion}${API_ENDPOINTS.SETTINGS_NOTIFICATIONS}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resp.ok) {
                const prefs = await resp.json();
                setSettings(prev => ({
                    ...prev,
                    notifications: {
                        emailAlerts: prefs.emailAlerts ?? prev.notifications.emailAlerts,
                        pushNotifications: prefs.pushNotifications ?? prev.notifications.pushNotifications,
                        soundEnabled: prefs.soundEnabled ?? prev.notifications.soundEnabled,
                        criticalOnly: prefs.criticalOnly ?? prev.notifications.criticalOnly,
                    },
                }));
            } else {
                logger.warn(`Failed to load notification preferences: server returned ${resp.status}`);
            }
        } catch (err) {
            logger.warn('Failed to load notification preferences from server, using localStorage fallback', err);
        }
    }, []);

    // Initial Load & Theme Effect
    useEffect(() => {
        function loadJson<T>(key: string, defaultVal: T): T {
            try {
                const stored = localStorage.getItem(key);
                if (!stored) return defaultVal;
                return JSON.parse(stored) as T;
            } catch (err) {
                logger.warn(`Failed to parse localStorage key "${key}", using default`, err);
                return defaultVal;
            }
        }

        function loadTheme(): ThemeSetting {
            const stored = localStorage.getItem('theme-setting');
            if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
            return 'system';
        }

        // Load auto-refresh from dedicated localStorage key
        const autoRefreshStored = localStorage.getItem(AUTO_REFRESH_KEY);
        const refreshIntervalStored = localStorage.getItem(REFRESH_INTERVAL_KEY);

        setSettings(prev => {
            const generalSettings: GeneralSettings = { ...prev.general, ...loadJson<Partial<GeneralSettings>>('general-settings', {}) };
            // If dedicated keys exist, they take precedence
            if (autoRefreshStored !== null) {
                generalSettings.autoRefresh = autoRefreshStored !== 'false';
            }
            if (refreshIntervalStored) {
                generalSettings.refreshInterval = refreshIntervalStored;
            }
            return {
                theme: loadTheme(),
                notifications: { ...prev.notifications, ...loadJson<Partial<typeof prev.notifications>>('notification-settings', {}) },
                general: generalSettings,
            };
        });
        loadNotificationPreferences();
    }, [loadNotificationPreferences]);

    useEffect(() => {
        if (settings.theme === 'system') document.documentElement.removeAttribute('data-theme-setting');
        else document.documentElement.setAttribute('data-theme-setting', settings.theme);
    }, [settings.theme]);

    // Handlers
    const updateTheme = useCallback((val: ThemeSetting) => {
        setSettings(p => ({ ...p, theme: val }));
    }, []);

    const updateNotification = useCallback((key: NotificationKey, val: boolean) => {
        setSettings(p => ({ ...p, notifications: { ...p.notifications, [key]: val } }));
    }, []);

    const updateGeneral = useCallback(<K extends keyof GeneralSettings>(key: K, val: GeneralSettings[K]) => {
        setSettings(p => ({ ...p, general: { ...p.general, [key]: val } }));
    }, []);

    const save = useCallback(async () => {
        localStorage.setItem('theme-setting', settings.theme);
        localStorage.setItem('notification-settings', JSON.stringify(settings.notifications));
        localStorage.setItem('general-settings', JSON.stringify(settings.general));

        // Persist auto-refresh to dedicated localStorage keys
        localStorage.setItem(AUTO_REFRESH_KEY, String(settings.general.autoRefresh));
        localStorage.setItem(REFRESH_INTERVAL_KEY, settings.general.refreshInterval);

        // Persist notification preferences to backend
        backendSaveFailedRef.current = false;
        try {
            const token = localStorage.getItem('noc_token');
            if (token) {
                const resp = await fetch(`${env.apiBaseUrl}/api/${env.apiVersion}${API_ENDPOINTS.SETTINGS_NOTIFICATIONS}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(settings.notifications),
                });
                if (!resp.ok) {
                    logger.error(`Failed to save notification preferences: server returned ${resp.status}`);
                    backendSaveFailedRef.current = true;
                    addToast('warning', 'Partial Save', 'Settings saved locally but the server returned an error. Changes may not persist across devices.');
                }
            }
        } catch (err) {
            logger.error('Failed to save notification preferences to server', err);
            backendSaveFailedRef.current = true;
            addToast('warning', 'Partial Save', 'Settings saved locally but could not sync to server. Changes may not persist across devices.');
        }

        if (!backendSaveFailedRef.current) {
            addToast('success', 'Settings saved', 'Your preferences have been updated successfully.');
        }
    }, [settings, addToast]);

    const handleTabChange = useCallback((val: string) => {
        const idx = TAB_VALUES.indexOf(val as typeof TAB_VALUES[number]);
        if (idx >= 0) setSelectedTab(idx);
    }, []);

    const handleRoleChange = useCallback((newRole: RoleId) => {
        setRoleInContext(newRole);
        addToast('success', 'Role Changed', `Switched to ${newRole} role`);
        navigate('/dashboard', { replace: true });
    }, [setRoleInContext, navigate, addToast]);

    return {
        settings,
        selectedTab,
        handleTabChange,
        updateTheme,
        updateNotification,
        updateGeneral,
        currentRoleId: currentRole.id,
        setRole: handleRoleChange,
        save,
    };
}
