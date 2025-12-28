import { useState, useEffect } from 'react';
import {
    Tile,
    Toggle,
    RadioButtonGroup,
    RadioButton,
    Select,
    SelectItem,
    Button,
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
    Time,
} from '@carbon/icons-react';
import '@/styles/SettingsPage.scss';

type ThemeSetting = 'system' | 'light' | 'dark';

interface NotificationSettings {
    emailAlerts: boolean;
    pushNotifications: boolean;
    soundEnabled: boolean;
    criticalOnly: boolean;
}

interface GeneralSettings {
    language: string;
    timezone: string;
    autoRefresh: boolean;
    refreshInterval: string;
}

export function SettingsPage() {
    // Theme state
    const [themeSetting, setThemeSetting] = useState<ThemeSetting>('system');

    // Notification settings state
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        emailAlerts: true,
        pushNotifications: true,
        soundEnabled: false,
        criticalOnly: false,
    });

    // General settings state
    const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
        language: 'en',
        timezone: 'UTC',
        autoRefresh: true,
        refreshInterval: '30',
    });

    // Success notification state
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    // Load theme setting from document on mount
    useEffect(() => {
        const currentTheme = document.documentElement.getAttribute('data-theme-setting');
        if (currentTheme === 'light' || currentTheme === 'dark' || currentTheme === 'system') {
            setThemeSetting(currentTheme);
        } else {
            setThemeSetting('system');
        }
    }, []);

    // Apply theme when changed
    const handleThemeChange = (value: ThemeSetting) => {
        setThemeSetting(value);
        if (value === 'system') {
            document.documentElement.removeAttribute('data-theme-setting');
        } else {
            document.documentElement.setAttribute('data-theme-setting', value);
        }
        // Persist to localStorage
        localStorage.setItem('theme-setting', value);
    };

    // Handle notification toggle changes
    const handleNotificationToggle = (key: keyof NotificationSettings) => {
        setNotificationSettings((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    // Handle general setting changes
    const handleGeneralSettingChange = (key: keyof GeneralSettings, value: string | boolean) => {
        setGeneralSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // Save all settings
    const handleSaveSettings = () => {
        // Persist settings to localStorage
        localStorage.setItem('notification-settings', JSON.stringify(notificationSettings));
        localStorage.setItem('general-settings', JSON.stringify(generalSettings));

        // Show success notification
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
    };

    return (
        <div className="settings-page">
            {/* Page Header */}
            <div className="settings-header">
                <div className="settings-header-left">
                    <h1 className="settings-title">Settings</h1>
                    <p className="settings-subtitle">
                        Customize your dashboard preferences and notification settings
                    </p>
                </div>
                <div className="settings-header-actions">
                    <Button kind="primary" renderIcon={Checkmark} onClick={handleSaveSettings}>
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Toast Notification - Fixed position top right */}
            {showSaveSuccess && (
                <div className="settings-toast-container">
                    <ToastNotification
                        kind="success"
                        title="Settings saved"
                        subtitle="Your preferences have been updated successfully."
                        timeout={3000}
                        onClose={() => setShowSaveSuccess(false)}
                        onCloseButtonClick={() => setShowSaveSuccess(false)}
                    />
                </div>
            )}

            {/* Settings Grid */}
            <div className="settings-grid">
                {/* Theme Selection */}
                <Tile className="settings-tile">
                    <div className="settings-tile-header">
                        <div className="settings-tile-icon">
                            {themeSetting === 'dark' ? (
                                <Moon size={24} />
                            ) : themeSetting === 'light' ? (
                                <Sun size={24} />
                            ) : (
                                <Laptop size={24} />
                            )}
                        </div>
                        <div className="settings-tile-title-group">
                            <h3 className="settings-tile-title">Appearance</h3>
                            <p className="settings-tile-description">
                                Choose your preferred theme for the dashboard
                            </p>
                        </div>
                    </div>
                    <div className="settings-tile-content">
                        <FormGroup legendText="Theme">
                            <RadioButtonGroup
                                name="theme-selection"
                                valueSelected={themeSetting}
                                onChange={(value) => handleThemeChange(value as ThemeSetting)}
                                orientation="vertical"
                            >
                                <RadioButton
                                    id="theme-system"
                                    value="system"
                                    labelText="System default"
                                />
                                <RadioButton
                                    id="theme-light"
                                    value="light"
                                    labelText="Light mode"
                                />
                                <RadioButton
                                    id="theme-dark"
                                    value="dark"
                                    labelText="Dark mode"
                                />
                            </RadioButtonGroup>
                        </FormGroup>
                    </div>
                </Tile>

                {/* Notification Settings */}
                <Tile className="settings-tile">
                    <div className="settings-tile-header">
                        <div className="settings-tile-icon notification-icon">
                            <Notification size={24} />
                        </div>
                        <div className="settings-tile-title-group">
                            <h3 className="settings-tile-title">Notifications</h3>
                            <p className="settings-tile-description">
                                Configure how you receive alerts and updates
                            </p>
                        </div>
                    </div>
                    <div className="settings-tile-content">
                        <div className="settings-toggle-group">
                            <div className="settings-toggle-item">
                                <div className="settings-toggle-info">
                                    <Email size={16} className="settings-toggle-icon" />
                                    <div className="settings-toggle-text">
                                        <span className="settings-toggle-label">Email Alerts</span>
                                        <span className="settings-toggle-description">
                                            Receive alert notifications via email
                                        </span>
                                    </div>
                                </div>
                                <Toggle
                                    id="email-alerts"
                                    labelA=""
                                    labelB=""
                                    toggled={notificationSettings.emailAlerts}
                                    onToggle={() => handleNotificationToggle('emailAlerts')}
                                    size="sm"
                                />
                            </div>
                            <div className="settings-toggle-item">
                                <div className="settings-toggle-info">
                                    <Notification size={16} className="settings-toggle-icon" />
                                    <div className="settings-toggle-text">
                                        <span className="settings-toggle-label">Push Notifications</span>
                                        <span className="settings-toggle-description">
                                            Receive browser push notifications
                                        </span>
                                    </div>
                                </div>
                                <Toggle
                                    id="push-notifications"
                                    labelA=""
                                    labelB=""
                                    toggled={notificationSettings.pushNotifications}
                                    onToggle={() => handleNotificationToggle('pushNotifications')}
                                    size="sm"
                                />
                            </div>
                            <div className="settings-toggle-item">
                                <div className="settings-toggle-info">
                                    <VolumeUp size={16} className="settings-toggle-icon" />
                                    <div className="settings-toggle-text">
                                        <span className="settings-toggle-label">Sound Effects</span>
                                        <span className="settings-toggle-description">
                                            Play sound for new alerts
                                        </span>
                                    </div>
                                </div>
                                <Toggle
                                    id="sound-enabled"
                                    labelA=""
                                    labelB=""
                                    toggled={notificationSettings.soundEnabled}
                                    onToggle={() => handleNotificationToggle('soundEnabled')}
                                    size="sm"
                                />
                            </div>
                            <div className="settings-toggle-item">
                                <div className="settings-toggle-info">
                                    <div className="settings-toggle-icon critical-badge" />
                                    <div className="settings-toggle-text">
                                        <span className="settings-toggle-label">Critical Alerts Only</span>
                                        <span className="settings-toggle-description">
                                            Only notify for critical severity alerts
                                        </span>
                                    </div>
                                </div>
                                <Toggle
                                    id="critical-only"
                                    labelA=""
                                    labelB=""
                                    toggled={notificationSettings.criticalOnly}
                                    onToggle={() => handleNotificationToggle('criticalOnly')}
                                    size="sm"
                                />
                            </div>
                        </div>
                    </div>
                </Tile>

                {/* General Settings */}
                <Tile className="settings-tile settings-tile--wide">
                    <div className="settings-tile-header">
                        <div className="settings-tile-icon general-icon">
                            <Time size={24} />
                        </div>
                        <div className="settings-tile-title-group">
                            <h3 className="settings-tile-title">General</h3>
                            <p className="settings-tile-description">
                                Manage language, timezone, and data refresh preferences
                            </p>
                        </div>
                    </div>
                    <div className="settings-tile-content settings-tile-content--general">
                        <div className="settings-select-row">
                            <Select
                                id="language-select"
                                labelText="Language"
                                value={generalSettings.language}
                                onChange={(e) =>
                                    handleGeneralSettingChange('language', e.target.value)
                                }
                            >
                                <SelectItem value="en" text="English" />
                                <SelectItem value="es" text="Español" />
                                <SelectItem value="fr" text="Français" />
                                <SelectItem value="de" text="Deutsch" />
                                <SelectItem value="ja" text="日本語" />
                                <SelectItem value="zh" text="中文" />
                            </Select>
                            <Select
                                id="timezone-select"
                                labelText="Timezone"
                                value={generalSettings.timezone}
                                onChange={(e) =>
                                    handleGeneralSettingChange('timezone', e.target.value)
                                }
                            >
                                <SelectItem value="UTC" text="UTC" />
                                <SelectItem value="America/New_York" text="Eastern Time (ET)" />
                                <SelectItem value="America/Chicago" text="Central Time (CT)" />
                                <SelectItem value="America/Denver" text="Mountain Time (MT)" />
                                <SelectItem value="America/Los_Angeles" text="Pacific Time (PT)" />
                                <SelectItem value="Europe/London" text="London (GMT/BST)" />
                                <SelectItem value="Europe/Paris" text="Paris (CET/CEST)" />
                                <SelectItem value="Asia/Tokyo" text="Tokyo (JST)" />
                                <SelectItem value="Asia/Kolkata" text="India (IST)" />
                            </Select>
                        </div>
                        <div className="settings-refresh-group">
                            <div className="settings-toggle-item">
                                <div className="settings-toggle-info">
                                    <div className="settings-toggle-text">
                                        <span className="settings-toggle-label">Auto-refresh Dashboard</span>
                                        <span className="settings-toggle-description">
                                            Automatically refresh alert data
                                        </span>
                                    </div>
                                </div>
                                <Toggle
                                    id="auto-refresh"
                                    labelA=""
                                    labelB=""
                                    toggled={generalSettings.autoRefresh}
                                    onToggle={() =>
                                        handleGeneralSettingChange('autoRefresh', !generalSettings.autoRefresh)
                                    }
                                    size="sm"
                                />
                            </div>
                            {generalSettings.autoRefresh && (
                                <Select
                                    id="refresh-interval"
                                    labelText="Refresh Interval"
                                    value={generalSettings.refreshInterval}
                                    onChange={(e) =>
                                        handleGeneralSettingChange('refreshInterval', e.target.value)
                                    }
                                    className="settings-refresh-interval"
                                >
                                    <SelectItem value="10" text="Every 10 seconds" />
                                    <SelectItem value="30" text="Every 30 seconds" />
                                    <SelectItem value="60" text="Every 1 minute" />
                                    <SelectItem value="300" text="Every 5 minutes" />
                                    <SelectItem value="600" text="Every 10 minutes" />
                                </Select>
                            )}
                        </div>
                    </div>
                </Tile>
            </div>
        </div>
    );
}

export default SettingsPage;
