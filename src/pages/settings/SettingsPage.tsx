import { useState, useEffect } from 'react';
import {
    Tile,
    Toggle,
    RadioButtonGroup,
    RadioButton,
    Select,
    SelectItem,
    ToastNotification,
    FormGroup,
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
import '@/styles/pages/_settings.scss';

// --- Configuration Constants ---
const GENERAL_OPTS = {
    languages: [
        { value: 'en', text: 'English' },
        { value: 'es', text: 'Español' },
        { value: 'fr', text: 'Français' },
        { value: 'de', text: 'Deutsch' },
        { value: 'ja', text: '日本語' },
        { value: 'zh', text: '中文' },
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
    { key: 'soundEnabled', label: 'Sound Effects', desc: 'Play sound for new alerts', icon: VolumeUp },
    { key: 'criticalOnly', label: 'Critical Alerts Only', desc: 'Only notify for critical severity alerts', icon: Events }
];

// --- Component ---
export function SettingsPage() {
    const { currentRole, setRole } = useRole();
    const [selectedTab, setSelectedTab] = useState(0);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    // State
    const [settings, setSettings] = useState({
        theme: 'system' as 'system' | 'light' | 'dark',
        notifications: { emailAlerts: true, pushNotifications: true, soundEnabled: false, criticalOnly: false },
        general: { language: 'en', timezone: 'UTC', autoRefresh: true, refreshInterval: '30' },
    });

    // Initial Load & Theme Effect
    useEffect(() => {
        const load = (key: string, defaultVal: any) => {
            const stored = localStorage.getItem(key);
            return stored ? (key === 'theme-setting' ? stored : JSON.parse(stored)) : defaultVal;
        };
        setSettings(prev => ({
            theme: load('theme-setting', 'system'),
            notifications: { ...prev.notifications, ...load('notification-settings', {}) },
            general: { ...prev.general, ...load('general-settings', {}) },
        }));
    }, []);

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

    const save = () => {
        localStorage.setItem('theme-setting', settings.theme);
        localStorage.setItem('notification-settings', JSON.stringify(settings.notifications));
        localStorage.setItem('general-settings', JSON.stringify(settings.general));
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
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
                                <Select id="lang" labelText="Language" value={settings.general.language} onChange={(e) => update('general', 'language', e.target.value)}>
                                    {GENERAL_OPTS.languages.map(opt => <SelectItem key={opt.value} {...opt} />)}
                                </Select>
                                <Select id="tz" labelText="Timezone" value={settings.general.timezone} onChange={(e) => update('general', 'timezone', e.target.value)}>
                                    {GENERAL_OPTS.timezones.map(opt => <SelectItem key={opt.value} {...opt} />)}
                                </Select>
                            </div>
                            <div className="settings-refresh-group">
                                <div className="settings-toggle-item">
                                    <div className="settings-toggle-info">
                                        <div className="settings-toggle-text">
                                            <span className="settings-toggle-label">Auto-refresh Dashboard</span>
                                            <span className="settings-toggle-description">Automatically refresh alert data</span>
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
                                {NOTIFICATION_OPTS.map((item) => (
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
                                ))}
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
            {showSaveSuccess && (
                <div className="settings-toast-container">
                    <ToastNotification kind="success" title="Settings saved" subtitle="Your preferences have been updated successfully." timeout={3000} onClose={() => setShowSaveSuccess(false)} />
                </div>
            )}
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
