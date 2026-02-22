/**
 * Ticket Components Index
 */

// TicketsPage (list view) components
export { TicketDetailPanel } from './TicketDetailPanel';
export type { TicketDetailPanelProps } from './TicketDetailPanel';

export { TicketKPIs } from './TicketKPIs';
export type { TicketKPIsProps } from './TicketKPIs';

export { TicketListPanel } from './TicketListPanel';
export type { TicketListPanelProps } from './TicketListPanel';

export {
  CreateTicketModal,
  ResolveTicketModal,
  ReassignTicketModal,
} from './TicketModals';
export type {
  CreateTicketFormData,
  AssigneeOption,
  CreateTicketModalProps,
  ResolveTicketModalProps,
  ReassignTicketModalProps,
} from './TicketModals';

export {
  formatRelativeTime,
  formatResolutionTime,
  isLinkableAlertId,
  buildActivityEntries,
  QUICK_TAB_OPTIONS,
  TABLE_HEADERS,
  SLA_THRESHOLDS_MS,
} from './ticketHelpers';
export type { QuickTab } from './ticketHelpers';

// TicketsPage hooks
export { useTicketData } from './useTicketData';
export type { UseTicketDataResult } from './useTicketData';

export { useTicketFilters } from './useTicketFilters';
export type { UseTicketFiltersResult } from './useTicketFilters';

export { useTicketActions } from './useTicketActions';
export type { UseTicketActionsResult } from './useTicketActions';

// TicketDetailsPage (detail view) components
export { TicketDetailsSkeleton } from './TicketDetailsSkeleton';
export { TicketInfoPanel } from './TicketInfoPanel';
export { TicketActivitySection } from './TicketActivitySection';

export type { TicketInfoPanelProps } from './TicketInfoPanel';
export type { TicketActivitySectionProps } from './TicketActivitySection';

export type {
  EditFormData,
  AlertOption,
  AssigneeSelectOption,
} from './ticketDetails.types';
export {
  formatDate as formatTicketDate,
  timeAgo,
} from './ticketDetails.types';
