/**
 * Copyright IBM Corp. 2026
 *
 * useTicketFilters - Filter, search, and pagination logic for TicketsPage.
 * Extracts all filter state, derived filtered/paginated ticket lists,
 * and the FilterBar dropdown configuration.
 */

import { useState, useMemo, useCallback } from 'react';

import type { TicketInfo } from '@/shared/services';
import { authService } from '@/shared/services';
import type { DropdownFilterConfig } from '@/components/ui/FilterBar';
import {
  PRIORITY_FILTER_OPTIONS,
  TICKET_STATUS_FILTER_OPTIONS,
} from '@/shared/constants/tickets';
import type { FilterOption } from '@/shared/constants/severity';

import { SLA_THRESHOLDS_MS, type QuickTab } from './ticketHelpers';

export interface UseTicketFiltersResult {
  searchQuery: string;
  handleSearchChange: (value: string) => void;
  selectedPriority: FilterOption;
  selectedStatus: FilterOption;
  activeQuickTab: QuickTab;
  kpiFilter: string | null;
  currentPage: number;
  pageSize: number;
  filteredTickets: TicketInfo[];
  paginatedTickets: TicketInfo[];
  filterDropdowns: DropdownFilterConfig[];
  handleKPIClick: (filterKey: string | null) => void;
  handleQuickTabChange: (tab: QuickTab) => void;
  handlePageChange: (page: number, ps: number) => void;
  clearAllFilters: () => void;
  clearKpiFilter: () => void;
}

export function useTicketFilters(tickets: TicketInfo[]): UseTicketFiltersResult {
  // ----- Filter state -----
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState(PRIORITY_FILTER_OPTIONS[0]);
  const [selectedStatus, setSelectedStatus] = useState(TICKET_STATUS_FILTER_OPTIONS[0]);
  const [activeQuickTab, setActiveQuickTab] = useState<QuickTab>('All');
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);

  // ----- Pagination state -----
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ----- Filter logic -----
  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.ticketNumber || '').toLowerCase().includes(q) ||
          (t.deviceName || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q)
      );
    }

    // Priority dropdown
    if (selectedPriority.id !== 'all') {
      result = result.filter((t) => t.priority === selectedPriority.id);
    }

    // Status dropdown
    if (selectedStatus.id !== 'all') {
      result = result.filter((t) => t.status === selectedStatus.id);
    }

    // Quick tab
    if (activeQuickTab === 'My Tickets') {
      const currentUser = authService.currentUser;
      const username = currentUser?.username || currentUser?.email || '';
      if (username) {
        result = result.filter(
          (t) => t.assignedTo === username || t.assignedTo === currentUser?.email
        );
      }
    } else if (activeQuickTab === 'Unassigned') {
      result = result.filter((t) => !t.assignedTo || t.assignedTo === 'Unassigned');
    }

    // KPI-based filter
    if (kpiFilter === 'open') {
      result = result.filter((t) => t.status === 'open');
    } else if (kpiFilter === 'my-tickets') {
      const currentUser = authService.currentUser;
      const username = currentUser?.username || currentUser?.email || '';
      if (username) {
        result = result.filter(
          (t) => t.assignedTo === username || t.assignedTo === currentUser?.email
        );
      }
    } else if (kpiFilter === 'sla-breached') {
      result = result.filter((t) => {
        if (t.status === 'resolved' || t.status === 'closed') return false;
        const created = new Date(t.createdAt.includes('T') ? t.createdAt : t.createdAt.replace(' ', 'T'));
        const threshold = SLA_THRESHOLDS_MS[t.priority] ?? 86400000;
        return Date.now() - created.getTime() > threshold;
      });
    }

    return result;
  }, [tickets, searchQuery, selectedPriority, selectedStatus, activeQuickTab, kpiFilter]);

  // ----- Pagination -----
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  // ----- Handlers -----
  const handleKPIClick = useCallback((filterKey: string | null) => {
    if (!filterKey) return;
    setKpiFilter((prev) => (prev === filterKey ? null : filterKey));
    setCurrentPage(1);
  }, []);

  const handleQuickTabChange = useCallback((tab: QuickTab) => {
    setActiveQuickTab(tab);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number, ps: number) => {
    setCurrentPage(page);
    setPageSize(ps);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedPriority(PRIORITY_FILTER_OPTIONS[0]);
    setSelectedStatus(TICKET_STATUS_FILTER_OPTIONS[0]);
    setActiveQuickTab('All');
    setKpiFilter(null);
    setCurrentPage(1);
  }, []);

  const clearKpiFilter = useCallback(() => {
    setKpiFilter(null);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  // ----- Filter bar config -----
  const filterDropdowns: DropdownFilterConfig[] = useMemo(
    () => [
      {
        id: 'priority-filter',
        label: 'Priority',
        options: PRIORITY_FILTER_OPTIONS,
        selectedItem: selectedPriority,
        onChange: (item) => {
          setSelectedPriority(item || PRIORITY_FILTER_OPTIONS[0]);
          setCurrentPage(1);
        },
      },
      {
        id: 'status-filter',
        label: 'Status',
        options: TICKET_STATUS_FILTER_OPTIONS,
        selectedItem: selectedStatus,
        onChange: (item) => {
          setSelectedStatus(item || TICKET_STATUS_FILTER_OPTIONS[0]);
          setCurrentPage(1);
        },
      },
    ],
    [selectedPriority, selectedStatus]
  );

  return {
    searchQuery,
    handleSearchChange,
    selectedPriority,
    selectedStatus,
    activeQuickTab,
    kpiFilter,
    currentPage,
    pageSize,
    filteredTickets,
    paginatedTickets,
    filterDropdowns,
    handleKPIClick,
    handleQuickTabChange,
    handlePageChange,
    clearAllFilters,
    clearKpiFilter,
  };
}
