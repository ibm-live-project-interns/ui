/**
 * Copyright IBM Corp. 2026
 *
 * Audit Log Page
 * Displays system-wide audit trail for sysadmin users.
 * Shows all user actions with filtering, pagination, and export capabilities.
 *
 * Child components:
 * - AuditKPIs: KPI cards row
 * - AuditDateFilters: Date range picker row
 * - AuditTable: DataTable with custom cell rendering
 * - AuditLogSkeleton: Loading skeleton
 *
 * State management: useAuditLog hook
 */

import { Button } from '@carbon/react';
import { Download, Renew } from '@carbon/icons-react';

// Reusable components
import { PageHeader, FilterBar } from '@/components';
import { PageLayout } from '@/components/layout';

// Page-specific child components + hook
import {
    AuditKPIs,
    AuditDateFilters,
    AuditTable,
    AuditLogSkeleton,
    useAuditLog,
} from './components';

// Styles
import '@/styles/components/_kpi-card.scss';
import '@/styles/pages/_audit-log.scss';

// ==========================================
// Component
// ==========================================

export function AuditLogPage() {
    const {
        auditLogs,
        totalLogs,
        stats,
        isLoading,
        loadError,
        searchInput,
        setSearchInput,
        setSearchQuery,
        filterDropdowns,
        startDate,
        endDate,
        handleStartDateChange,
        handleEndDateChange,
        hasActiveFilters,
        clearAllFilters,
        currentPage,
        pageSize,
        handlePageChange,
        fetchAuditLogs,
        handleExportCSV,
    } = useAuditLog();

    // Loading skeleton
    if (isLoading && auditLogs.length === 0) {
        return <AuditLogSkeleton />;
    }

    return (
        <PageLayout>
        <div className="audit-log-page">
            <PageHeader
                breadcrumbs={[
                    { label: 'Admin', href: '/dashboard' },
                    { label: 'Audit Log', active: true },
                ]}
                title="Audit Log"
                subtitle="System-wide activity trail for compliance and security monitoring"
                showBorder
                actions={[
                    {
                        label: 'Refresh',
                        onClick: fetchAuditLogs,
                        variant: 'secondary',
                        icon: Renew,
                    },
                    {
                        label: 'Export CSV',
                        onClick: handleExportCSV,
                        variant: 'primary',
                        icon: Download,
                        disabled: auditLogs.length === 0,
                    },
                ]}
            />

            {loadError && (
                <div className="u-centered-message">
                    <p className="u-centered-message__error-text">
                        Failed to load audit logs: {loadError}
                    </p>
                    <Button kind="tertiary" size="sm" onClick={fetchAuditLogs}>Retry</Button>
                </div>
            )}

            <div className="audit-log-page__content">
                <AuditKPIs stats={stats} />

                <FilterBar
                    searchEnabled
                    searchPlaceholder="Search by user, action, or resource..."
                    searchValue={searchInput}
                    onSearchChange={(value) => {
                        setSearchInput(value);
                        if (!value) setSearchQuery('');
                    }}
                    dropdowns={filterDropdowns}
                    onClearAll={clearAllFilters}
                    totalCount={totalLogs}
                    filteredCount={auditLogs.length}
                    itemLabel="audit log entries"
                />

                <AuditDateFilters
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={handleStartDateChange}
                    onEndDateChange={handleEndDateChange}
                    hasActiveFilters={hasActiveFilters}
                    onClearAll={clearAllFilters}
                />

                <AuditTable
                    auditLogs={auditLogs}
                    totalLogs={totalLogs}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={clearAllFilters}
                />
            </div>
        </div>
        </PageLayout>
    );
}

export default AuditLogPage;
