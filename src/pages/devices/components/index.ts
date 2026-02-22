/**
 * Device Components - Child Components Barrel Export
 */

// Device Groups components
export { GroupCard } from './GroupCard';
export { GroupFormModal } from './GroupFormModal';
export { DeleteGroupModal } from './DeleteGroupModal';
export { GroupsSkeleton } from './GroupsSkeleton';

export type { GroupCardProps } from './GroupCard';
export type { GroupFormModalProps } from './GroupFormModal';
export type { DeleteGroupModalProps } from './DeleteGroupModal';

export type { FilterOption, DeviceOption } from './deviceGroups.types';
export {
    COLOR_OPTIONS,
    EMPTY_FORM,
    getDeviceDisplayName,
} from './deviceGroups.types';

// Device Groups hook
export { useDeviceGroups } from './useDeviceGroups';
export type { UseDeviceGroupsReturn } from './useDeviceGroups';

// Device Details components
export { DeviceDetailsSkeleton } from './DeviceDetailsSkeleton';
export { DeviceOverviewSection } from './DeviceOverviewSection';
export { DeviceMetricsCharts } from './DeviceMetricsCharts';

export type { DeviceOverviewSectionProps } from './DeviceOverviewSection';
export type { DeviceMetricsChartsProps } from './DeviceMetricsCharts';

export type {
    MetricDataPoint,
    MetricsPeriod,
    MetricsAPIResponse,
    Incident,
} from './deviceDetails.types';
export {
    PERIOD_OPTIONS,
    INCIDENT_HEADERS,
    buildMetricsUrl,
    getStatusBadgeColor,
    getStatusConfigKey,
    getHealthColor,
} from './deviceDetails.types';

// Device Explorer components
export { DeviceTable } from './DeviceTable';
export type { DeviceTableProps } from './DeviceTable';

// Device Explorer hook
export { useDeviceExplorer } from './useDeviceExplorer';
export type { UseDeviceExplorerReturn } from './useDeviceExplorer';

// Device Details hook
export { useDeviceDetails } from './useDeviceDetails';
export type { UseDeviceDetailsReturn } from './useDeviceDetails';
