/**
 * Copyright IBM Corp. 2026
 *
 * Reports Hub Page
 * Centralized hub for generating, downloading, and navigating to all report types.
 * Supports CSV export via /api/v1/reports/export and links to existing report pages.
 */

import {
    Document,
    Calendar,
    RecentlyViewed,
} from '@carbon/icons-react';

// Reusable components
import { KPICard, PageHeader } from '@/components';
import { PageLayout } from '@/components/layout';

// Config & constants
import { ROUTES } from '@/shared/constants/routes';

// Child components + hook
import { ReportCard, useReportsHub, REPORT_TYPES } from './components';

// Styles
import '@/styles/pages/_reports-hub.scss';

// ==========================================
// Component
// ==========================================

export function ReportsHubPage() {
    const {
        totalGenerated,
        lastReportDate,
        downloading,
        refreshKey,
        handleAction,
    } = useReportsHub();

    return (
        <PageLayout>
        <div className="reports-hub">
            {/* Page Header */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', href: ROUTES.DASHBOARD },
                    { label: 'Reports', active: true },
                ]}
                title="Reports"
                subtitle="Generate, download, and schedule reports for network monitoring data."
                showBorder
            />

            {/* KPI Row */}
            <div className="reports-hub__kpi-row">
                <KPICard
                    label="Total Reports Generated"
                    value={totalGenerated}
                    icon={Document}
                    iconColor="var(--cds-interactive, #0f62fe)"
                    severity="info"
                    subtitle="All-time downloads"
                />
                <KPICard
                    label="Last Report Date"
                    value={lastReportDate}
                    icon={Calendar}
                    iconColor="var(--cds-support-info, #8a3ffc)"
                    severity="neutral"
                    subtitle="Most recent export"
                />
                <KPICard
                    label="Available Report Types"
                    value={REPORT_TYPES.length}
                    icon={RecentlyViewed}
                    iconColor="var(--cds-support-success, #198038)"
                    severity="success"
                    subtitle="CSV and interactive reports"
                />
            </div>

            {/* Report Cards Grid */}
            <div className="reports-hub__grid">
                {REPORT_TYPES.map((report) => (
                    <ReportCard
                        key={report.id}
                        report={report}
                        isDownloading={downloading[report.id] === true}
                        refreshKey={refreshKey}
                        onAction={handleAction}
                    />
                ))}
            </div>

        </div>
        </PageLayout>
    );
}

export default ReportsHubPage;
