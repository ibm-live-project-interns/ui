/**
 * Reports - Child Components Barrel Export
 */

// SLA child components
export { ComplianceTrendChart } from './ComplianceTrendChart';
export type { SLATrendPoint } from './ComplianceTrendChart';

export { ComplianceBySeverityTable } from './ComplianceBySeverityTable';
export type { SeverityBreakdown } from './ComplianceBySeverityTable';

export { ViolationsTable } from './ViolationsTable';
export type { SLAViolation } from './ViolationsTable';

export { SLAReportsSkeleton } from './SLAReportsSkeleton';

// SLA Service
export { slaService } from './slaService';

// SLA Hook
export { useSLAReports } from './useSLAReports';
export type { UseSLAReportsReturn } from './useSLAReports';

// SLA Types & constants
export type {
    SLAOverview,
    SLAViolationsResponse,
    SLATrendResponse,
    PeriodOption,
} from './sla.types';
export { SLA_PERIOD_OPTIONS, SLA_TARGET_PERCENT } from './sla.types';

// Reports Hub child components
export { ReportCard } from './ReportCard';
export type { ReportCardProps } from './ReportCard';

// Reports Hub Hook
export { useReportsHub, REPORT_TYPES } from './useReportsHub';
export type { UseReportsHubReturn, ReportType } from './useReportsHub';
