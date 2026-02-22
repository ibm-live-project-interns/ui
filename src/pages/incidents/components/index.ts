/**
 * Incident History & Post-Mortem - Child Components Barrel Export
 */

// Incident History components
export { IncidentCharts, IncidentRightColumn } from './IncidentCharts';
export { IncidentTable } from './IncidentTable';
export { IncidentSkeleton } from './IncidentSkeleton';

export type { ResolvedIncident } from './IncidentTable';
export type { RootCauseDistribution, DurationChartData, PreventionAction } from './IncidentCharts';
export type { TimeRangeOption } from './types';

export {
  SLA_THRESHOLD_MINUTES,
  TIME_RANGE_OPTIONS,
  ROOT_CAUSE_COLORS,
  computeDuration,
  categorizeRootCause,
  formatDate,
  derivePreventionActions,
} from './types';

// Post-Mortem components
export { PostMortemSkeleton } from './PostMortemSkeleton';
export { PostMortemDetail } from './PostMortemDetail';
export { PostMortemTable } from './PostMortemTable';

export {
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  TABLE_HEADERS as PM_TABLE_HEADERS,
  getStatusTagType,
  getStatusLabel,
  getCategoryTagType,
  parseJsonField,
} from './postmortem.types';
