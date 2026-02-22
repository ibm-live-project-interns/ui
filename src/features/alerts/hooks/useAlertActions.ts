/**
 * useAlertActions Hook
 *
 * Provides actions for alert management:
 * - acknowledge: Mark alert as acknowledged
 * - createTicket: Create a support ticket
 * - dismiss: Dismiss the alert
 *
 * Uses alertService for API calls with mock fallback based on env config.
 */

import { useCallback, useState } from 'react';
import { alertDataService } from '../services/alertService';
import { ticketDataService } from '@/features/tickets/services/ticketService';
import { logger } from '@/shared/utils/logger';

interface TicketData {
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    assignee?: string;
}

interface UseAlertActionsResult {
    acknowledge: (alertId: string) => Promise<void>;
    createTicket: (alertId: string, ticketData: TicketData) => Promise<string>;
    dismiss: (alertId: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export function useAlertActions(): UseAlertActionsResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const acknowledge = useCallback(async (alertId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await alertDataService.acknowledgeAlert(alertId);
            logger.info(`Alert ${alertId} acknowledged`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to acknowledge alert';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createTicket = useCallback(async (alertId: string, ticketData: TicketData): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            const ticket = await ticketDataService.createTicket({
                title: ticketData.title,
                description: ticketData.description,
                priority: ticketData.priority,
                alertId: alertId,
            });
            logger.info(`Ticket created: ${ticket.id}`, { alertId, ticketData });
            return ticket.id;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create ticket';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const dismiss = useCallback(async (alertId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await alertDataService.dismissAlert(alertId);
            logger.info(`Alert ${alertId} dismissed`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to dismiss alert';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        acknowledge,
        createTicket,
        dismiss,
        isLoading,
        error,
    };
}

export default useAlertActions;
