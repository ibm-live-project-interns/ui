/**
 * ConfigurationPage
 *
 * Thin shell that renders the page header with tabs and delegates
 * each tab panel to its own sub-component. Each tab component owns
 * its own state, data fetching, DataTable, and modals.
 */

import { useState } from 'react';

import { PageHeader } from '@/components/ui';
import { PageLayout } from '@/components/layout/PageLayout';

import {
    ThresholdRulesTab,
    NotificationChannelsTab,
    EscalationPoliciesTab,
    MaintenanceWindowsTab,
} from './tabs';

import '@/styles/pages/_configuration.scss';

const TAB_VALUES = ['rules', 'channels', 'policies', 'maintenance'] as const;

export function ConfigurationPage() {
    const [selectedTab, setSelectedTab] = useState(0);

    return (
        <PageLayout className="configuration-page">
            <PageHeader
                title="Alert Configuration"
                subtitle="Manage threshold rules, notification channels, and escalation policies"
                breadcrumbs={[
                    { label: 'Configuration', href: '/configuration' },
                    { label: 'Alert Rules', active: true },
                ]}
                tabs={[
                    { label: 'Threshold Rules', value: 'rules' },
                    { label: 'Notification Channels', value: 'channels' },
                    { label: 'Escalation Policies', value: 'policies' },
                    { label: 'Maintenance Windows', value: 'maintenance' },
                ]}
                selectedTab={TAB_VALUES[selectedTab]}
                onTabChange={(val) => {
                    const idx = TAB_VALUES.indexOf(val as typeof TAB_VALUES[number]);
                    if (idx >= 0) setSelectedTab(idx);
                }}
                showBorder={false}
            />

            <div className={`configuration-content${selectedTab === 0 ? ' configuration-content--with-sidebar' : ''}`}>
                {selectedTab === 0 && (
                    <ThresholdRulesTab
                        onNavigateToChannels={() => setSelectedTab(1)}
                    />
                )}
                {selectedTab === 1 && <NotificationChannelsTab />}
                {selectedTab === 2 && <EscalationPoliciesTab />}
                {selectedTab === 3 && <MaintenanceWindowsTab />}
            </div>
        </PageLayout>
    );
}

export default ConfigurationPage;
