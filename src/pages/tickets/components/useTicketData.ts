/**
 * Copyright IBM Corp. 2026
 *
 * useTicketData - Data fetching hook for TicketsPage.
 * Encapsulates fetching tickets, ticket stats, alerts list, and assignee options.
 */

import { useState, useEffect } from 'react';

import {
  ticketDataService,
  alertDataService,
  userService,
  type TicketInfo,
} from '@/shared/services';
import type { TicketStats } from '@/features/tickets/services/ticketService';
import { useFetchData } from '@/shared/hooks';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/contexts';

import type { AssigneeOption } from './TicketModals';

export interface UseTicketDataResult {
  tickets: TicketInfo[];
  isLoading: boolean;
  refetchTickets: () => void;
  ticketStats: TicketStats | null;
  alertsList: { id: string; label: string }[];
  assigneeOptions: AssigneeOption[];
}

export function useTicketData(): UseTicketDataResult {
  const { addToast } = useToast();

  const { data: tickets, isLoading, refetch: refetchTickets } = useFetchData<TicketInfo[]>(
    async () => ticketDataService.getTickets(),
    [],
    {
      initialData: [],
      onError: (err) => {
        logger.error('Failed to fetch tickets', err);
        addToast('error', 'Load Failed', 'Could not load tickets');
      },
    }
  );

  const { data: ticketStats } = useFetchData<TicketStats>(
    async () => ticketDataService.getStats(),
    [],
    {
      onError: (err) => logger.warn('Failed to fetch ticket stats', err),
    }
  );

  const { data: alertsList } = useFetchData<{ id: string; label: string }[]>(
    async () => {
      const alerts = await alertDataService.getAlerts();
      return alerts.map((a: Record<string, unknown>) => ({
        id: String(a.id ?? ''),
        label: `${a.id} — ${(a as Record<string, unknown>).aiTitle || (a as Record<string, unknown>).title || 'Alert'}`,
      }));
    },
    [],
    { initialData: [] }
  );

  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  useEffect(() => {
    userService
      .getUsers()
      .then((users) => {
        const opts = (Array.isArray(users) ? users : []).map((u: Record<string, unknown>) => ({
          value: String(u.username || `${u.first_name || ''} ${u.last_name || ''}`.trim()),
          text: `${u.first_name || ''} ${u.last_name || ''}`.trim() || String(u.username || u.email || ''),
        }));
        setAssigneeOptions(opts);
      })
      .catch(() => {
        setAssigneeOptions([
          { value: 'John Smith', text: 'John Smith' },
          { value: 'Jane Doe', text: 'Jane Doe' },
          { value: 'NOC Team', text: 'NOC Team' },
        ]);
      });
  }, []);

  return {
    tickets: tickets ?? [],
    isLoading,
    refetchTickets,
    ticketStats: ticketStats ?? null,
    alertsList: alertsList ?? [],
    assigneeOptions,
  };
}
