/**
 * Alert Data Service
 *
 * Unified data layer for alert operations.
 * Connects to backend API for all alert-related operations.
 *
 * Usage:
 *   import { alertDataService } from '@/features/alerts/services';
 *   const alerts = await alertDataService.getAlerts();
 */

import { alertLogger } from '@/shared/utils/logger';
import { ApiAlertDataService } from './alertService.api';
import type { IAlertDataService } from './alertService.types';

// Re-export all types for consumers
export type {
    IAlertDataService,
    AlertDistribution,
    LinkedTicket,
    SuggestedRunbook,
    PostMortemActionItem,
    PostMortem,
    CreatePostMortemRequest,
    BulkActionType,
    BulkActionResult,
    OnCallScheduleEntry,
} from './alertService.types';

// Re-export shared types that were previously re-exported from this file
export type { TrendKPI, RecurringAlert, AIInsight } from './alertService.types';

// ==========================================
// Service Factory & Export
// ==========================================

function createAlertDataService(): IAlertDataService {
    alertLogger.info('Using API alert service');
    return new ApiAlertDataService();
}

// Export singleton instance
export const alertDataService = createAlertDataService();
