/**
 * Copyright IBM Corp. 2026
 *
 * Settings Page
 *
 * Allows users to customize their dashboard preferences: theme, role,
 * notification settings, and general settings (language, timezone, refresh).
 *
 * All state management lives in the useSettings hook.
 * Tab content is rendered by GeneralSettingsTab, RoleSection,
 * AppearanceSection, and NotificationsTab components.
 */

import { Tile } from '@carbon/react';
import {
    Checkmark,
    Moon,
    Sun,
    Laptop,
    Notification,
    User,
    Globe,
} from '@carbon/icons-react';
import { PageHeader } from '@/components/ui';
import { PageLayout } from '@/components/layout';

import {
    useSettings,
    GeneralSettingsTab,
    RoleSection,
    AppearanceSection,
    NotificationsTab,
} from './components';

import '@/styles/pages/_settings.scss';

// ==========================================
// Tab configuration types
// ==========================================

interface TabSection {
    title: string;
    desc: string;
    icon: typeof Globe;
    fullWidth?: boolean;
    render: () => React.ReactNode;
}

interface TabConfig {
    label: string;
    value: string;
    content: TabSection[];
}

// ==========================================
// Component
// ==========================================

export function SettingsPage() {
    const {
        settings,
        selectedTab,
        handleTabChange,
        updateTheme,
        updateNotification,
        updateGeneral,
        currentRoleId,
        setRole,
        save,
    } = useSettings();

    // Build tab configuration with rendered child components
    const TABS_CONFIG: TabConfig[] = [
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
                        <GeneralSettingsTab
                            general={settings.general}
                            onUpdate={updateGeneral}
                        />
                    ),
                },
            ],
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
                        <RoleSection
                            currentRoleId={currentRoleId}
                            onRoleChange={setRole}
                        />
                    ),
                },
                {
                    title: 'Appearance',
                    desc: 'Choose your preferred theme for the dashboard',
                    icon: settings.theme === 'dark' ? Moon : settings.theme === 'light' ? Sun : Laptop,
                    render: () => (
                        <AppearanceSection
                            theme={settings.theme}
                            onThemeChange={updateTheme}
                        />
                    ),
                },
            ],
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
                        <NotificationsTab
                            notifications={settings.notifications}
                            onUpdate={updateNotification}
                        />
                    ),
                },
            ],
        },
    ];

    const currentTab = TABS_CONFIG[selectedTab];
    const isGrid = currentTab.content.length > 1;

    return (
        <PageLayout>
        <div className="settings-page">
            <PageHeader
                breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings', active: true }]}
                title="Settings"
                subtitle="Customize your dashboard preferences and notification settings"
                actions={[{ label: 'Save Changes', icon: Checkmark, variant: 'primary', onClick: save }]}
                tabs={TABS_CONFIG.map(t => ({ label: t.label, value: t.value }))}
                selectedTab={currentTab.value}
                onTabChange={handleTabChange}
                showBorder={false}
            />
            <div className={`settings-content ${isGrid ? 'settings-content--grid' : ''}`}>
                {currentTab.content.map((section, idx) => (
                    <Tile key={idx} className={`settings-tile ${section.fullWidth ? 'settings-tile--wide' : ''}`}>
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
        </PageLayout>
    );
}

export default SettingsPage;
