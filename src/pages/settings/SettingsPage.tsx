import { useState, useEffect, useCallback } from 'react';
import {
    Tile,
    Toggle,
    RadioButtonGroup,
    RadioButton,
    Select,
    SelectItem,
    FormGroup,
    Tooltip,
} from '@carbon/react';
import {
    Checkmark,
    Moon,
    Sun,
    Laptop,
    Notification,
    Email,
    VolumeUp,
    User,
    Globe,
    Events,
} from '@carbon/icons-react';
import { useRole } from '@/features/roles/hooks';
import { ROLE_CONFIGS } from '@/features/roles/config/roleConfig';
import type { RoleId } from '@/features/roles/types';
import { PageHeader } from '@/components/ui';
import { env, API_ENDPOINTS } from '@/shared/config';
import { useToast } from '@/contexts';
import '@/styles/pages/_settings.scss';

// --- Configuration Constants ---

/** localStorage key for the auto-refresh enabled flag */
const AUTO_REFRESH_KEY = 'settings_autoRefresh';
/** localStorage key for the auto-refresh interval in seconds */
const REFRESH_INTERVAL_KEY = 'settings_refreshInterval';
const GENERAL_OPTS = {
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
    ]
};

const NOTIFICATION_OPTS = [
    { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive alert notifications via email', icon: Email },
    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive browser push notifications', icon: Notification },
    { key: 'soundEnabled', label: 'Sound Effects', desc: 'Play sound for new alerts (Coming soon)', icon: VolumeUp, comingSoon: true },
    { key: 'criticalOnly', label: 'Critical Alerts Only', desc: 'Only notify for critical severity alerts', icon: Events }
];

// --- Component ---
export function SettingsPage() {
    const { currentRole, setRole } = useRole();
    const [selectedTab, setSelectedTab] = useState(0);
    const { addToast } = useToast();

    // State
    const [settings, setSettings] = useState({
        theme: 'system' as 'system' | 'light' | 'dark',
        notifications: { emailAlerts: true, pushNotifications: true, soundEnabled: false, criticalOnly: false },
        general: { language: 'en', timezone: 'UTC', autoRefresh: true, refreshInterval: '30' },
    });

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
            }
        } catch {
            // Fall back to localStorage
        }
    }, []);

    // Initial Load & Theme Effect
    useEffect(() => {
        const load = (key: string, defaultVal: any) => {
            const stored = localStorage.getItem(key);
            return stored ? (key === 'theme-setting' ? stored : JSON.parse(stored)) : defaultVal;
        };

        // Load auto-refresh from dedicated localStorage key
        const autoRefreshStored = localStorage.getItem(AUTO_REFRESH_KEY);
        const refreshIntervalStored = localStorage.getItem(REFRESH_INTERVAL_KEY);

        setSettings(prev => {
            const generalSettings = { ...prev.general, ...load('general-settings', {}) };
            // If dedicated keys exist, they take precedence
            if (autoRefreshStored !== null) {
                generalSettings.autoRefresh = autoRefreshStored !== 'false';
            }
            if (refreshIntervalStored) {
                generalSettings.refreshInterval = refreshIntervalStored;
            }
            return {
                theme: load('theme-setting', 'system'),
                notifications: { ...prev.notifications, ...load('notification-settings', {}) },
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
    const update = (section: string, key: string, val: any) => {
        if (section === 'theme') {
            setSettings(p => ({ ...p, theme: val }));
        } else {
            // @ts-ignore - dynamic key access
            setSettings(p => ({ ...p, [section]: { ...p[section], [key]: val } }));
        }
    };

    const save = async () => {
        localStorage.setItem('theme-setting', settings.theme);
        localStorage.setItem('notification-settings', JSON.stringify(settings.notifications));
        localStorage.setItem('general-settings', JSON.stringify(settings.general));

        // Persist auto-refresh to dedicated localStorage keys
        // so other pages can read them without parsing the full settings blob
        localStorage.setItem(AUTO_REFRESH_KEY, String(settings.general.autoRefresh));
        localStorage.setItem(REFRESH_INTERVAL_KEY, settings.general.refreshInterval);

        // Persist notification preferences to backend
        try {
            const token = localStorage.getItem('noc_token');
            if (token) {
                await fetch(`${env.apiBaseUrl}/api/${env.apiVersion}${API_ENDPOINTS.SETTINGS_NOTIFICATIONS}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(settings.notifications),
                });
            }
        } catch {
            // localStorage is still saved as fallback
        }

        addToast('success', 'Settings saved', 'Your preferences have been updated successfully.');
    };

    const TABS_CONFIG = [
        {
            label: 'General',
            value: 'general',
            content: [
                {
                    title: 'General Settings',
                    desc: 'Manage language, timezone, and data refresh preferences',
                    icon: Globe,
                    fullWidth: true,
                    render: () => (
                        <div className="settings-tile-content settings-tile-content--general">
                            <div className="settings-select-row">
                                {/* Language selector -- i18n is not yet implemented */}
                                <Tooltip align="bottom" label="i18n coming soon -- only English is currently supported">
                                    <div>
                                        <Select id="lang" labelText="Language" value={settings.general.language} onChange={(e) => update('general', 'language', e.target.value)} helperText="Only English is currently supported">
                                            {GENERAL_OPTS.languages.map(opt => <SelectItem key={opt.value} {...opt} />)}
                                        </Select>
                                    </div>
                                </Tooltip>
                                <Select id="tz" labelText="Timezone" value={settings.general.timezone} onChange={(e) => update('general', 'timezone', e.target.value)}>
                                    {GENERAL_OPTS.timezones.map(opt => <SelectItem key={opt.value} {...opt} />)}
                                </Select>
                            </div>
                            <div className="settings-refresh-group">
                                <div className="settings-toggle-item">
                                    <div className="settings-toggle-info">
                                        <div className="settings-toggle-text">
                                            <span className="settings-toggle-label">Auto-refresh Dashboard</span>
                                            <span className="settings-toggle-description">Automatically refresh alert data across all pages</span>
                                        </div>
                                    </div>
                                    <Toggle id="auto-refresh" labelA="" labelB="" size="sm" toggled={settings.general.autoRefresh} onToggle={() => update('general', 'autoRefresh', !settings.general.autoRefresh)} />
                                </div>
                                {settings.general.autoRefresh && (
                                    <Select id="interval" labelText="Refresh Interval" value={settings.general.refreshInterval} onChange={(e) => update('general', 'refreshInterval', e.target.value)} className="settings-refresh-interval">
                                        {GENERAL_OPTS.intervals.map(opt => <SelectItem key={opt.value} {...opt} />)}
                                    </Select>
                                )}
                            </div>
                        </div>
                    )
                }
            ]
        },
        {
            label: 'Appearance & Role',
            value: 'preferences',
            content: [
                {
                    title: 'User Role',
                    desc: 'Select your role to customize your dashboard view',
                    icon: User,
                    render: () => (
                        <FormGroup legendText="Dashboard Role" className="settings-form-group">
                            <RadioButtonGroup name="role-selection" valueSelected={currentRole.id} onChange={(v) => setRole(v as RoleId)} orientation="vertical">
                                {Object.values(ROLE_CONFIGS).map((role) => (
                                    <RadioButton key={role.id} id={`role-${role.id}`} value={role.id} labelText={
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600 }}>{role.name}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--cds-text-secondary)', marginTop: '4px' }}>{role.description}</span>
                                        </div>
                                    } />
                                ))}
                            </RadioButtonGroup>
                        </FormGroup>
                    )
                },
                {
                    title: 'Appearance',
                    desc: 'Choose your preferred theme for the dashboard',
                    icon: settings.theme === 'dark' ? Moon : settings.theme === 'light' ? Sun : Laptop,
                    render: () => (
                        <FormGroup legendText="Theme" className="settings-form-group">
                            <RadioButtonGroup name="theme-selection" valueSelected={settings.theme} onChange={(v) => update('theme', '', v)} orientation="vertical">
                                <RadioButton id="theme-system" value="system" labelText="System default" />
                                <RadioButton id="theme-light" value="light" labelText="Light mode" />
                                <RadioButton id="theme-dark" value="dark" labelText="Dark mode" />
                            </RadioButtonGroup>
                        </FormGroup>
                    )
                }
            ]
        },
        {
            label: 'Notifications',
            value: 'notifications',
            content: [
                {
                    title: 'Notification Preferences',
                    desc: 'Configure how you receive alerts and updates',
                    icon: Notification,
                    fullWidth: true,
                    render: () => (
                        <div className="settings-tile-content">
                            <div className="settings-toggle-group">
                                {NOTIFICATION_OPTS.map((item) => {
                                    const toggleContent = (
                                        <div className="settings-toggle-item" key={item.key}>
                                            <div className="settings-toggle-info">
                                                <item.icon size={16} className="settings-toggle-icon" />
                                                <div className="settings-toggle-text">
                                                    <span className="settings-toggle-label">{item.label}</span>
                                                    <span className="settings-toggle-description">{item.desc}</span>
                                                </div>
                                            </div>
                                            {/* @ts-ignore */}
                                            <Toggle id={item.key} labelA="" labelB="" size="sm" toggled={settings.notifications[item.key]} onToggle={() => update('notifications', item.key, !settings.notifications[item.key])} />
                                        </div>
                                    );

                                    // Sound notifications are not yet implemented
                                    if ('comingSoon' in item && item.comingSoon) {
                                        return (
                                            <Tooltip key={item.key} align="bottom" label="Coming soon">
                                                {toggleContent}
                                            </Tooltip>
                                        );
                                    }
                                    return toggleContent;
                                })}
                            </div>
                        </div>
                    )
                }
            ]
        }
    ];

    const currentTab = TABS_CONFIG[selectedTab];
    const isGrid = currentTab.content.length > 1;

    return (
        <div className="settings-page">
            <PageHeader
                breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings', active: true }]}
                title="Settings"
                subtitle="Customize your dashboard preferences and notification settings"
                actions={[{ label: 'Save Changes', icon: Checkmark, variant: 'primary', onClick: save }]}
                tabs={TABS_CONFIG.map(t => ({ label: t.label, value: t.value }))}
                selectedTab={currentTab.value}
                onTabChange={(val) => setSelectedTab(TABS_CONFIG.findIndex(t => t.value === val))}
                showBorder={false}
            />
            <div className="settings-content" style={{ display: isGrid ? 'grid' : 'block', gridTemplateColumns: isGrid ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                {currentTab.content.map((section, idx) => (
                    <Tile key={idx} className={`settings-tile ${'fullWidth' in section && section.fullWidth ? 'settings-tile--wide' : ''}`} style={{ height: '100%' }}>
                        <div className="settings-tile-header">
                            <div className="settings-tile-icon"><section.icon size={24} /></div>
                            <div className="settings-tile-title-group">
                                <h3 className="settings-tile-title">{section.title}</h3>
                                <p className="settings-tile-description">{section.desc}</p>
                            </div>
                        </div>
                        {section.render()}
                    </Tile>
                ))}
            </div>
        </div>
    );
}

export default SettingsPage;
