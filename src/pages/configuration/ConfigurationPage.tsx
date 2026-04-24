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

type TabValue = 'rules' | 'channels' | 'policies' | 'maintenance';

export function ConfigurationPage() {
    const [selectedTab, setSelectedTab] = useState<TabValue>('rules');

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
                selectedTab={selectedTab}
                onTabChange={(val) => setSelectedTab(val as TabValue)}
                showBorder={false}
            />

            <div className={`configuration-content${selectedTab === 'rules' ? ' configuration-content--with-sidebar' : ''}`}>
                {selectedTab === 'rules' && (
                    <ThresholdRulesTab
                        onNavigateToChannels={() => setSelectedTab('channels')}
                    />
                )}
                {selectedTab === 'channels' && <NotificationChannelsTab />}
                {selectedTab === 'policies' && <EscalationPoliciesTab />}
                {selectedTab === 'maintenance' && <MaintenanceWindowsTab />}
            </div>
        </PageLayout>
    );
}

export default ConfigurationPage;
