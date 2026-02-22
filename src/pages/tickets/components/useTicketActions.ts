/**
 * Copyright IBM Corp. 2026
 *
 * useTicketActions - Action handlers and modal state for TicketsPage.
 * Manages ticket selection, comments, create/resolve/reassign modals,
 * batch operations, and CSV export.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  ticketDataService,
  type TicketInfo,
} from '@/shared/services';
import type { TicketComment } from '@/features/tickets/services/ticketService';
import { exportCSV } from '@/shared/utils/exportCSV';
import { useToast } from '@/contexts';
import { logger } from '@/shared/utils/logger';

import { buildActivityEntries, type QuickTab as _QuickTab } from './ticketHelpers';
import type { CreateTicketFormData, AssigneeOption } from './TicketModals';

export interface UseTicketActionsOptions {
  tickets: TicketInfo[];
  paginatedTickets: TicketInfo[];
  assigneeOptions: AssigneeOption[];
  refetchTickets: () => void;
}

export interface UseTicketActionsResult {
  // Selection
  selectedTicketId: string | null;
  selectedTicket: TicketInfo | null;
  selectedTicketComments: TicketComment[];
  isLoadingComments: boolean;
  detailTab: number;
  handleSelectTicket: (ticketId: string) => void;
  setDetailTab: (tab: number) => void;
  activityEntries: ReturnType<typeof buildActivityEntries>;

  // Create modal
  isCreateModalOpen: boolean;
  isCreating: boolean;
  createForm: CreateTicketFormData;
  setIsCreateModalOpen: (open: boolean) => void;
  setCreateForm: React.Dispatch<React.SetStateAction<CreateTicketFormData>>;
  handleCreateTicket: () => Promise<void>;

  // Resolve modal
  isResolveModalOpen: boolean;
  isResolving: boolean;
  resolveNotes: string;
  setIsResolveModalOpen: (open: boolean) => void;
  setResolveNotes: (notes: string) => void;
  handleResolveTicket: (ticketId: string) => Promise<void>;

  // Reassign modal
  isReassignModalOpen: boolean;
  isReassigning: boolean;
  reassignTarget: string;
  setIsReassignModalOpen: (open: boolean) => void;
  setReassignTarget: (target: string) => void;
  handleBatchReassign: () => Promise<void>;

  // Batch actions
  batchSelectedIds: string[];
  setBatchSelectedIds: (ids: string[]) => void;
  handleBatchResolve: () => Promise<void>;

  // Export
  handleExportCSV: () => Promise<void>;

  // Comment
  handleAddComment: (content: string) => Promise<void>;
}

const EMPTY_CREATE_FORM: CreateTicketFormData = {
  title: '',
  description: '',
  priority: 'medium',
  alertId: '',
  deviceName: '',
  assignee: '',
};

export function useTicketActions({
  tickets,
  paginatedTickets,
  refetchTickets,
}: UseTicketActionsOptions): UseTicketActionsResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  // ----- Selection state -----
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicketComments, setSelectedTicketComments] = useState<TicketComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [detailTab, setDetailTab] = useState(0);

  // ----- Create modal state -----
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTicketFormData>(EMPTY_CREATE_FORM);

  // ----- Resolve modal state -----
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // ----- Reassign modal state -----
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignTarget, setReassignTarget] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // ----- Batch state -----
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([]);

  // Handle ?alertId query param for pre-selection from alert page
  useEffect(() => {
    const alertIdParam = searchParams.get('alertId');
    if (alertIdParam) {
      setCreateForm((prev) => ({ ...prev, alertId: alertIdParam }));
      setIsCreateModalOpen(true);
      searchParams.delete('alertId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // ----- Selected ticket -----
  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );

  // Auto-select first ticket if none selected
  useEffect(() => {
    if (!selectedTicketId && paginatedTickets.length > 0) {
      setSelectedTicketId(paginatedTickets[0].id);
    }
  }, [paginatedTickets, selectedTicketId]);

  // Fetch comments when selection changes
  useEffect(() => {
    if (!selectedTicketId) {
      setSelectedTicketComments([]);
      return;
    }
    let cancelled = false;
    setIsLoadingComments(true);
    ticketDataService
      .getComments(selectedTicketId)
      .then((comments) => {
        if (!cancelled) setSelectedTicketComments(comments);
      })
      .catch((err) => {
        if (!cancelled) {
          logger.warn('Failed to fetch comments', err);
          setSelectedTicketComments([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingComments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTicketId]);

  // ----- Activity entries -----
  const activityEntries = useMemo(
    () => buildActivityEntries(selectedTicket, selectedTicketComments),
    [selectedTicket, selectedTicketComments]
  );

  // ----- Handlers -----

  const handleSelectTicket = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId);
    setDetailTab(0);
  }, []);

  const handleExportCSV = useCallback(async () => {
    try {
      await exportCSV('tickets');
      addToast('success', 'Export Complete', 'Tickets CSV downloaded');
    } catch (error) {
      logger.error('Failed to export tickets CSV', error);
      addToast('error', 'Export Failed', 'Could not export tickets to CSV');
    }
  }, [addToast]);

  const handleCreateTicket = useCallback(async () => {
    if (!createForm.title.trim()) return;
    setIsCreating(true);
    try {
      const newTicket = await ticketDataService.createTicket({
        alertId: createForm.alertId || '',
        title: createForm.title,
        description: createForm.description,
        priority: createForm.priority,
        deviceName: createForm.deviceName || 'Manual Entry',
        assignee: createForm.assignee,
      });
      refetchTickets();
      setIsCreateModalOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      addToast('success', 'Ticket Created', `${newTicket.ticketNumber} has been created`);
    } catch (error) {
      logger.error('Failed to create ticket', error);
      addToast('error', 'Creation Failed', 'Could not create ticket');
    } finally {
      setIsCreating(false);
    }
  }, [createForm, refetchTickets, addToast]);

  const handleResolveTicket = useCallback(
    async (ticketId: string) => {
      setIsResolving(true);
      try {
        await ticketDataService.updateTicket(ticketId, { status: 'resolved' });
        if (resolveNotes.trim()) {
          await ticketDataService.addComment(ticketId, resolveNotes);
        }
        refetchTickets();
        setIsResolveModalOpen(false);
        setResolveNotes('');
        addToast('success', 'Ticket Resolved', 'The ticket has been resolved');
      } catch (error) {
        logger.error('Failed to resolve ticket', error);
        addToast('error', 'Resolve Failed', 'Could not resolve the ticket');
      } finally {
        setIsResolving(false);
      }
    },
    [resolveNotes, refetchTickets, addToast]
  );

  const handleBatchResolve = useCallback(async () => {
    try {
      await Promise.all(batchSelectedIds.map((id) => ticketDataService.updateTicket(id, { status: 'resolved' })));
      refetchTickets();
      setBatchSelectedIds([]);
      addToast('success', 'Tickets Resolved', `${batchSelectedIds.length} tickets resolved`);
    } catch (error) {
      logger.error('Failed to batch resolve', error);
      addToast('error', 'Batch Resolve Failed', 'Could not resolve selected tickets');
    }
  }, [batchSelectedIds, refetchTickets, addToast]);

  const handleBatchReassign = useCallback(async () => {
    if (!reassignTarget) return;
    setIsReassigning(true);
    try {
      await Promise.all(
        batchSelectedIds.map((id) => ticketDataService.updateTicket(id, { assignedTo: reassignTarget } as Partial<TicketInfo>))
      );
      refetchTickets();
      setBatchSelectedIds([]);
      setIsReassignModalOpen(false);
      setReassignTarget('');
      addToast('success', 'Tickets Reassigned', `${batchSelectedIds.length} tickets reassigned to ${reassignTarget}`);
    } catch (error) {
      logger.error('Failed to batch reassign', error);
      addToast('error', 'Reassign Failed', 'Could not reassign selected tickets');
    } finally {
      setIsReassigning(false);
    }
  }, [batchSelectedIds, reassignTarget, refetchTickets, addToast]);

  const handleAddComment = useCallback(
    async (content: string) => {
      if (!selectedTicketId || !content.trim()) return;
      try {
        const newComment = await ticketDataService.addComment(selectedTicketId, content);
        setSelectedTicketComments((prev) => [newComment, ...prev]);
        addToast('success', 'Comment Added', 'Your comment has been posted');
      } catch (error) {
        logger.error('Failed to add comment', error);
        addToast('error', 'Comment Failed', 'Could not add comment');
      }
    },
    [selectedTicketId, addToast]
  );

  return {
    // Selection
    selectedTicketId,
    selectedTicket,
    selectedTicketComments,
    isLoadingComments,
    detailTab,
    handleSelectTicket,
    setDetailTab,
    activityEntries,

    // Create modal
    isCreateModalOpen,
    isCreating,
    createForm,
    setIsCreateModalOpen,
    setCreateForm,
    handleCreateTicket,

    // Resolve modal
    isResolveModalOpen,
    isResolving,
    resolveNotes,
    setIsResolveModalOpen,
    setResolveNotes,
    handleResolveTicket,

    // Reassign modal
    isReassignModalOpen,
    isReassigning,
    reassignTarget,
    setIsReassignModalOpen,
    setReassignTarget,
    handleBatchReassign,

    // Batch actions
    batchSelectedIds,
    setBatchSelectedIds,
    handleBatchResolve,

    // Export
    handleExportCSV,

    // Comment
    handleAddComment,
  };
}
