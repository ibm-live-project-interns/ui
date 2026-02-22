/**
 * Copyright IBM Corp. 2026
 *
 * Trends & Insights Page
 * Historical analysis and pattern detection powered by AI
 *
 * Child components:
 * - AlertsPerHourChart: Stacked bar chart of alerts by hour/severity
 * - RecurringAlerts: Top recurring alert types with severity filter
 * - AlertDistribution: Donut chart with peak/quietest hours
 * - AIImpactSection: AI impact line chart + metric cards
 * - AIInsightsPanel: AI-generated insight cards grid
 */

import { Tile, Button, Dropdown, SkeletonText, SkeletonPlaceholder } from '@carbon/react';
import { Download, ChartLine } from '@carbon/icons-react';
import '@carbon/charts-react/styles.css';

// Reusable components
import { KPICard, NoisyDevicesCard, PageHeader, EmptyState, ComingSoonModal, useComingSoon } from '@/components/ui';
import { PageLayout } from '@/components/layout';

// Page-specific child components + hook
import {
    AlertsPerHourChart,
    RecurringAlerts,
    AlertDistribution,
    AIImpactSection,
    AIInsightsPanel,
    useTrends,
} from './components';

// Constants
import { TIME_PERIOD_OPTIONS } from '@/shared/constants/severity';
import { ROUTES } from '@/shared/constants/routes';

// Styles
import '@/styles/pages/_trends.scss';

export function TrendsPage() {
    const {
        isLoading,
        selectedTimePeriod,
        setSelectedTimePeriod,
        currentTheme,
        lastFetchTime,
        kpiCards,
        alertsOverTime,
        recurringAlerts,
        detailsDistribution,
        aiMetrics,
        noisyDevices,
        aiInsights,
        aiImpactOverTime,
        systemStatus,
        isEmptyPage,
        handleInsightAction,
        handleExportReport: _handleExportReport,
        navigateToDevices,
    } = useTrends();

    const { open: comingSoonOpen, feature: comingSoonFeature, showComingSoon, hideComingSoon } = useComingSoon();

    const handleExportReport = () => {
        showComingSoon({
            name: 'PDF Export',
            description: 'PDF report generation is currently under development. CSV export is available from the Reports Hub.',
            alternativeLabel: 'Go to Reports Hub',
            onAlternative: () => { window.location.href = ROUTES.REPORTS; },
        });
    };

    // Skeleton loading state
    if (isLoading && kpiCards.length === 0) {
        return (
            <PageLayout>
            <div className="trends-insights-page">
                <PageHeader
                    title="Trends & Insights"
                    subtitle="Loading..."
                    badges={[{ text: systemStatus.text, color: systemStatus.color }]}
                />
                <div className="kpi-row">
                    {[1, 2, 3, 4].map((i) => (
                        <Tile key={i} className="kpi-card-skeleton">
                            <SkeletonText width="60%" />
                            <SkeletonText heading width="40%" />
                            <SkeletonText width="80%" />
                        </Tile>
                    ))}
                </div>
                <Tile className="alerts-chart-tile">
                    <SkeletonPlaceholder className="trends-skeleton-chart" />
                </Tile>
            </div>
            </PageLayout>
        );
    }

    // Empty state
    if (!isLoading && isEmptyPage) {
        return (
            <PageLayout>
            <div className="trends-insights-page">
                <PageHeader
                    title="Trends & Insights"
                    subtitle="Historical analysis and pattern detection powered by AI"
                    badges={[{ text: systemStatus.text, color: systemStatus.color }]}
                />
                <EmptyState
                    icon={ChartLine}
                    title="No trends data available"
                    description="Unable to retrieve insights at this time."
                    size="lg"
                />
            </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
        <div className="trends-insights-page">
            {/* Dashboard Header */}
            <PageHeader
                title="Trends & Insights"
                subtitle="Historical analysis and pattern detection powered by AI"
                showBreadcrumbs
                breadcrumbs={[
                    { label: 'Home', href: ROUTES.DASHBOARD },
                    { label: 'Trends', active: true },
                ]}
                badges={[{ text: systemStatus.text, color: systemStatus.color }]}
                rightContent={
                    <div className="trends-header-actions">
                        <Dropdown
                            id="time-period-dropdown"
                            titleText="Time period"
                            hideLabel
                            label="Select Time Period"
                            items={TIME_PERIOD_OPTIONS}
                            itemToString={(item) => item?.text || ''}
                            selectedItem={selectedTimePeriod}
                            onChange={({ selectedItem }) =>
                                setSelectedTimePeriod(selectedItem || TIME_PERIOD_OPTIONS[2])
                            }
                            size="md"
                        />
                        <Button kind="primary" size="md" renderIcon={Download} onClick={handleExportReport}>
                            Export Report
                        </Button>
                    </div>
                }
            />

            {/* KPI Stats Row */}
            <div className="kpi-row">
                {kpiCards.length > 0 ? (
                    kpiCards.map((card) => (
                        <KPICard key={card.id} {...card} />
                    ))
                ) : (
                    <div className="trends-kpi-empty">No KPI Data</div>
                )}
            </div>

            {/* Alerts Per Hour Chart */}
            <AlertsPerHourChart
                alertsOverTime={alertsOverTime}
                currentTheme={currentTheme}
            />

            {/* Middle Row: Recurring Alerts & Distribution */}
            <div className="middle-row">
                <RecurringAlerts recurringAlerts={recurringAlerts} />

                <AlertDistribution
                    detailsDistribution={detailsDistribution}
                    alertsOverTime={alertsOverTime}
                    currentTheme={currentTheme}
                />
            </div>

            {/* AI Impact & Top Noisy Devices */}
            <div className="bottom-row">
                <AIImpactSection
                    aiImpactOverTime={aiImpactOverTime}
                    aiMetrics={aiMetrics}
                    currentTheme={currentTheme}
                />

                <NoisyDevicesCard
                    title="Top Noisy Devices"
                    subtitle="Devices generating most alerts"
                    devices={noisyDevices}
                    variant="gradient"
                    showViewAll
                    onViewAll={navigateToDevices}
                />
            </div>

            {/* AI-Generated Insights */}
            <AIInsightsPanel
                insights={aiInsights}
                lastFetchTime={lastFetchTime}
                onInsightAction={handleInsightAction}
            />
            {/* Coming Soon Modal */}
            <ComingSoonModal open={comingSoonOpen} onClose={hideComingSoon} feature={comingSoonFeature} />
        </div>
        </PageLayout>
    );
}

export default TrendsPage;
