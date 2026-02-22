/**
 * Copyright IBM Corp. 2026
 *
 * Device Explorer Page
 *
 * Displays a grid/table view of all network devices with filtering and search.
 * Uses centralized types from @/shared/types.
 * Uses centralized constants from @/shared/constants.
 * Uses deviceService for data fetching (supports mock/API mode).
 *
 * All state management lives in the useDeviceExplorer hook.
 * Table rendering lives in the DeviceTable component.
 */

import {
    Tile,
    SkeletonText,
    SkeletonPlaceholder,
} from '@carbon/react';
import {
    Settings,
    Renew,
} from '@carbon/icons-react';
import { KPICard, PageHeader, FilterBar } from '@/components/ui';
import { PageLayout } from '@/components/layout';
import { DEVICE_STATUS_CONFIG } from '@/shared/constants';
import { ROUTES } from '@/shared/constants/routes';

import { useDeviceExplorer, DeviceTable } from './components';

import '@/styles/pages/_device-explorer.scss';

// ==========================================
// Component
// ==========================================

export function DeviceExplorerPage() {
    const {
        devices,
        stats,
        isLoading,
        searchTerm,
        filteredDevices,
        paginatedDevices,
        currentPage,
        pageSize,
        setCurrentPage,
        setPageSize,
        filterDropdowns,
        clearAllFilters,
        onSearchChange,
        handleViewDevice,
        handleRefresh,
        navigateToSettings,
    } = useDeviceExplorer();

    // ---- Loading ----

    if (isLoading) {
        return (
            <PageLayout>
            <div className="device-explorer-page">
                <PageHeader
                    title="Device Explorer"
                    subtitle="Loading devices..."
                />
                <div className="kpi-row">
                    {[1, 2, 3, 4].map(i => (
                        <Tile key={i}>
                            <SkeletonText width="60%" />
                            <SkeletonText heading width="40%" />
                        </Tile>
                    ))}
                </div>
                <div className="device-table-container">
                    <Tile>
                        <SkeletonPlaceholder className="device-skeleton-placeholder" />
                    </Tile>
                </div>
            </div>
            </PageLayout>
        );
    }

    // ---- Main ----

    return (
        <PageLayout>
        <div className="device-explorer-page">
            <PageHeader
                title="Device Explorer"
                subtitle={`${stats.total} devices monitored`}
                showBreadcrumbs
                breadcrumbs={[
                    { label: 'Home', href: ROUTES.DASHBOARD },
                    { label: 'Devices', active: true },
                ]}
                actions={[
                    { label: 'Refresh', icon: Renew, variant: 'ghost', onClick: handleRefresh },
                    { label: 'Settings', icon: Settings, variant: 'secondary', onClick: navigateToSettings },
                ]}
            />

            {/* KPI Cards */}
            <div className="kpi-row">
                <KPICard
                    label="Online"
                    value={stats.online}
                    icon={DEVICE_STATUS_CONFIG.online.icon}
                    iconColor={DEVICE_STATUS_CONFIG.online.iconColor}
                    severity="success"
                    subtitle={stats.total > 0 ? `${Math.round((stats.online / stats.total) * 100)}% of devices` : 'No devices'}
                />
                <KPICard
                    label="Critical Issues"
                    value={stats.critical}
                    icon={DEVICE_STATUS_CONFIG.critical.icon}
                    iconColor={DEVICE_STATUS_CONFIG.critical.iconColor}
                    severity="critical"
                    subtitle="Requires immediate attention"
                />
                <KPICard
                    label="Warnings"
                    value={stats.warning}
                    icon={DEVICE_STATUS_CONFIG.warning.icon}
                    iconColor={DEVICE_STATUS_CONFIG.warning.iconColor}
                    severity="major"
                    subtitle="Performance degradation"
                />
                <KPICard
                    label="Offline"
                    value={stats.offline}
                    icon={DEVICE_STATUS_CONFIG.offline.icon}
                    iconColor={DEVICE_STATUS_CONFIG.offline.iconColor}
                    severity="neutral"
                    subtitle="Not responding"
                />
            </div>

            {/* Filters */}
            <FilterBar
                searchEnabled
                searchPlaceholder="Search devices by name or IP..."
                searchValue={searchTerm}
                onSearchChange={onSearchChange}
                dropdowns={filterDropdowns}
                onClearAll={clearAllFilters}
                totalCount={devices.length}
                filteredCount={filteredDevices.length}
                itemLabel="devices"
            />

            {/* Device Table */}
            <div className="device-table-container">
                <Tile className="devices-table-tile">
                    <DeviceTable
                        paginatedDevices={paginatedDevices}
                        filteredCount={filteredDevices.length}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        onPageChange={(page, newPageSize) => {
                            setCurrentPage(page);
                            setPageSize(newPageSize);
                        }}
                        onViewDevice={handleViewDevice}
                    />
                </Tile>
            </div>
        </div>
        </PageLayout>
    );
}

export default DeviceExplorerPage;
