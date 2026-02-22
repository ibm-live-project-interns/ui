import { Download, Checkmark } from '@carbon/icons-react';

import { KPICard, PageHeader, FilterBar } from '@/components';
import { PageLayout } from '@/components/layout';
import type { KPICardProps } from '@/components/ui/KPICard';
import { ROUTES } from '@/shared/constants/routes';

import {
    AlertsLoadingSkeleton,
    AlertsDataTable,
    QUICK_FILTERS,
    usePriorityAlerts,
} from './components';

import '@/styles/pages/_priority-alerts.scss';
import '@/styles/components/_kpi-card.scss';

export function PriorityAlertsPage() {
    const {
        alerts,
        isLoading,
        isBulkActing,
        searchQuery,
        filteredAlerts,
        activeQuickFilters,
        filterDropdowns,
        currentPage,
        pageSize,
        paginatedAlerts,
        tableRows,
        kpiData,
        handleAcknowledgeAlert,
        handleAcknowledgeAll,
        handleExportCSV,
        handleBulkAction,
        toggleQuickFilter,
        clearAllFilters,
        onSearchChange,
        navigateToAlert,
        onPaginationChange,
    } = usePriorityAlerts();

    // ==========================================
    // Render
    // ==========================================

    if (isLoading && alerts.length === 0) {
        return <AlertsLoadingSkeleton />;
    }

    return (
        <PageLayout>
            <div className="priority-alerts-page">
                <PageHeader
                    title="Priority Alerts"
                    subtitle="Critical and high-priority network alerts requiring immediate attention"
                    showBreadcrumbs
                    breadcrumbs={[
                        { label: 'Home', href: ROUTES.DASHBOARD },
                        { label: 'Priority Alerts', active: true },
                    ]}
                    showBorder={true}
                    actions={[
                        {
                            label: 'Export CSV',
                            onClick: handleExportCSV,
                            variant: 'ghost',
                            icon: Download,
                        },
                        {
                            label: 'Acknowledge All',
                            onClick: handleAcknowledgeAll,
                            variant: 'primary',
                            icon: Checkmark,
                        },
                    ]}
                />

                <div className="priority-alerts-page__content">
                    <div className="kpi-row">
                        {kpiData.map((kpi: KPICardProps) => (
                            <KPICard key={kpi.id} {...kpi} />
                        ))}
                    </div>

                    <FilterBar
                        searchEnabled
                        searchPlaceholder="Search by device, summary, or title..."
                        searchValue={searchQuery}
                        onSearchChange={onSearchChange}
                        dropdowns={filterDropdowns}
                        quickFilters={QUICK_FILTERS}
                        activeQuickFilters={activeQuickFilters}
                        onQuickFilterToggle={toggleQuickFilter}
                        onClearAll={clearAllFilters}
                        totalCount={alerts.length}
                        filteredCount={filteredAlerts.length}
                        itemLabel="alerts"
                    />

                    <AlertsDataTable
                        tableRows={tableRows}
                        paginatedAlerts={paginatedAlerts}
                        filteredCount={filteredAlerts.length}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        isBulkActing={isBulkActing}
                        onNavigateToAlert={navigateToAlert}
                        onAcknowledgeAlert={handleAcknowledgeAlert}
                        onBulkAction={handleBulkAction}
                        onPaginationChange={onPaginationChange}
                    />
                </div>
            </div>
        </PageLayout>
    );
}

export default PriorityAlertsPage;
