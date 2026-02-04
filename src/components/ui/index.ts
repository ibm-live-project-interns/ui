/**
 * UI Components Index
 */

// Original components
export { ChartWrapper } from './ChartWrapper';
export { KPIRow } from './KPIRow';
export { NoisyDevicesCard, type NoisyDeviceItem, type NoisyDevicesCardProps } from './NoisyDevicesCard';

// Enhanced components
export { AlertTicker, type AlertTickerProps, type CriticalAlert } from './AlertTicker';
export {
    KPICard,
    type KPICardProps,
    type KPISeverity,
    type KPITrend,
    type TrendDirection
} from './KPICard';

export {
    PageHeader,
    type PageHeaderProps,
    type Breadcrumb,
    type PageBadge,
    type PageAction
} from './PageHeader';

export {
    DataTableWrapper,
    type DataTableWrapperProps,
    type DataTableWrapperAction
} from './DataTableWrapper';

export {
    DashboardHeader,
    type DashboardHeaderProps,
    type SystemStatus
} from './DashboardHeader';
