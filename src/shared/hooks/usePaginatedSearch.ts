/**
 * Copyright IBM Corp. 2026
 *
 * usePaginatedSearch Hook
 * Combines search filtering and pagination for an in-memory list of items.
 * Replaces the duplicated searchQuery + currentPage + pageSize + filteredData +
 * paginatedData pattern found across TicketsPage, AuditLogPage, etc.
 */

import { useState, useMemo } from 'react';

export interface UsePaginatedSearchResult<T> {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filtered: T[];
  paginated: T[];
  totalFiltered: number;
  page: number;
  pageSize: number;
  onPageChange: (data: { page: number; pageSize: number }) => void;
}

export function usePaginatedSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  defaultPageSize = 10
): UsePaginatedSearchResult<T> {
  const [searchQuery, setSearchQueryState] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const val = item[field];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [items, searchQuery, searchFields]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const onPageChange = (data: { page: number; pageSize: number }) => {
    setPage(data.page);
    setPageSize(data.pageSize);
  };

  // Reset to page 1 when search changes
  const setSearchQuery = (q: string) => {
    setSearchQueryState(q);
    setPage(1);
  };

  return {
    searchQuery,
    setSearchQuery,
    filtered,
    paginated,
    totalFiltered: filtered.length,
    page,
    pageSize,
    onPageChange,
  };
}
