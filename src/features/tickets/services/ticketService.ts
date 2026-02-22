/**
 * Ticket Data Service
 *
 * Unified data layer for ticket operations.
 * Persists tickets in localStorage for mock mode, API for production.
 *
 * Usage:
 *   import { ticketDataService } from '@/features/tickets/services';
 *   const tickets = await ticketDataService.getTickets();
 */

import { env } from '@/shared/config';
import { ticketLogger } from '@/shared/utils/logger';
import { ApiTicketDataService, MockTicketDataService } from './ticketService.api';
import type { ITicketDataService } from './ticketService.types';

// Re-export all types for consumers
export type {
    ITicketDataService,
    TicketInfo,
    CreateTicketData,
    TicketComment,
    TicketStats,
} from './ticketService.types';

// ==========================================
// Service Factory & Export
// ==========================================

function createTicketDataService(): ITicketDataService {
    if (env.useMockData) {
        ticketLogger.info('Using mock data');
        return new MockTicketDataService();
    }
    ticketLogger.info('Using API: ' + env.apiBaseUrl);
    return new ApiTicketDataService();
}

// Export singleton instance
export const ticketDataService = createTicketDataService();
