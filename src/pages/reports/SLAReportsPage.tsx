/**
 * Copyright IBM Corp. 2026
 *
 * SLA Compliance Reports Page
 * Displays SLA metrics, compliance trends, severity breakdown, and violation details.
 * Fetches real data from the /api/v1/reports/sla endpoints.
 *
 * State management: useSLAReports hook
 * Child components: ComplianceTrendChart, ComplianceBySeverityTable, ViolationsTable, SLAReportsSkeleton
 */

import { Dropdown } from '@carbon/react';
import {
    Download,
    WarningAlt,
} from '@carbon/icons-react';

// Reusable components
import { KPICard, PageHeader, EmptyState } from '@/components';
import { PageLayout } from '@/components/layout';
import { ROUTES } from '@/shared/constants/routes';

// Child components + hook
import {
    ComplianceTrendChart,
    ComplianceBySeverityTable,
    ViolationsTable,
    SLAReportsSkeleton,
    useSLAReports,
    SLA_PERIOD_OPTIONS,
    SLA_TARGET_PERCENT,
} from './components';

// Styles
import '@/styles/pages/_sla-reports.scss';

// ==========================================
// Component
// ==========================================

export function SLAReportsPage() {
    const {
        selectedPeriod,
        setSelectedPeriod,
        overview,
        violations,
        trend,
        isLoading,
        currentTheme,
        violationsPage,
        violationsPageSize,
        handleViolationsPageChange,
        kpiCards,
        isEmpty,
        handleExport,
    } = useSLAReports();

    // Period selector dropdown (shared by header in all states)
    const periodDropdown = (
        <Dropdown
            id="sla-period-dropdown"
            titleText="SLA reporting period"
            hideLabel
            label="Select Period"
            items={SLA_PERIOD_OPTIONS}
            itemToString={(item) => item?.text || ''}
            selectedItem={selectedPeriod}
            onChange={({ selectedItem }) =>
                setSelectedPeriod(selectedItem || SLA_PERIOD_OPTIONS[0])
            }
            size="md"
        />
    );

    // Loading skeleton
    if (isLoading && !overview) {
        return <SLAReportsSkeleton />;
    }

    // Empty state
    if (!isLoading && isEmpty) {
        return (
            <PageLayout>
                <div className="sla-reports-page">
                    <PageHeader
                        title="SLA Compliance Reports"
                        subtitle="Service level agreement compliance tracking and analysis"
                        showBreadcrumbs
                        breadcrumbs={[
                            { label: 'Home', href: ROUTES.DASHBOARD },
                            { label: 'Reports', href: ROUTES.REPORTS },
                            { label: 'SLA Reports', active: true },
                        ]}
                        showBorder
                        rightContent={periodDropdown}
                    />
                    <EmptyState
                        icon={WarningAlt}
                        title="No SLA data available"
                        description="No alert data was found for the selected period. SLA metrics require resolved alerts to compute compliance."
                        size="lg"
                    />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="sla-reports-page">
                {/* Page Header */}
                <PageHeader
                    title="SLA Compliance Reports"
                    subtitle="Service level agreement compliance tracking and analysis"
                    showBreadcrumbs
                    breadcrumbs={[
                        { label: 'Home', href: ROUTES.DASHBOARD },
                        { label: 'Reports', href: ROUTES.REPORTS },
                        { label: 'SLA Reports', active: true },
                    ]}
                    showBorder
                    rightContent={periodDropdown}
                    actions={[
                        {
                            label: 'Export Report',
                            onClick: handleExport,
                            variant: 'primary',
                            icon: Download,
                        },
                    ]}
                />

                {/* KPI Row */}
                <div className="kpi-row">
                    {kpiCards.map((kpi) => (
                        <KPICard key={kpi.id} {...kpi} />
                    ))}
                </div>

                {/* SLA Compliance Trend Chart */}
                <ComplianceTrendChart
                    trend={trend}
                    targetPercent={SLA_TARGET_PERCENT}
                    currentTheme={currentTheme}
                />

                {/* Two-column: Severity Table + Violations Summary */}
                <div className="sla-reports-page__two-column-grid">
                    {/* SLA by Severity Table */}
                    <ComplianceBySeverityTable
                        bySeverity={overview?.by_severity || []}
                    />
                </div>

                <ViolationsTable
                    violations={violations}
                    selectedPeriodText={selectedPeriod.text}
                    violationsPage={violationsPage}
                    violationsPageSize={violationsPageSize}
                    onPageChange={handleViolationsPageChange}
                />
            </div>
        </PageLayout>
    );
}

export default SLAReportsPage;
