/**
 * Copyright IBM Corp. 2026
 *
 * TicketListPanel - Left panel of the split-view ticket layout.
 * Displays quick filter tabs, a DataTable with batch actions,
 * and pagination controls.
 */

import React, { useRef, useEffect } from 'react';
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableSelectAll,
  TableSelectRow,
  TableToolbar,
  TableBatchActions,
  TableBatchAction,
  TableToolbarContent,
  Button,
  Pagination,
  ContentSwitcher,
  Switch,
} from '@carbon/react';
import {
  Ticket,
  Checkmark,
  UserMultiple,
  Close,
  Link as LinkIcon,
} from '@carbon/icons-react';

import { EmptyState } from '@/components';
import type { TicketInfo } from '@/shared/services';
import {
  getPriorityTag,
  getTicketStatusTag,
} from '@/shared/constants/tickets';
import {
  QUICK_TAB_OPTIONS,
  TABLE_HEADERS,
  formatRelativeTime,
  isLinkableAlertId,
  type QuickTab,
} from './ticketHelpers';

// ==========================================
// Props
// ==========================================

export interface TicketListPanelProps {
  /** Tickets for the current page (post-pagination) */
  paginatedTickets: TicketInfo[];
  /** Total filtered ticket count (pre-pagination) */
  filteredCount: number;
  /** Currently selected ticket ID in split view */
  selectedTicketId: string | null;
  /** Active quick tab filter */
  activeQuickTab: QuickTab;
  /** Active KPI filter key (null if none) */
  kpiFilter: string | null;
  /** Pagination state */
  currentPage: number;
  pageSize: number;

  // Callbacks
  onSelectTicket: (ticketId: string) => void;
  onQuickTabChange: (tab: QuickTab) => void;
  onClearKpiFilter: () => void;
  onBatchResolve: () => void;
  onBatchReassign: () => void;
  onBatchSelectionChange: (selectedIds: string[]) => void;
  onClearAllFilters: () => void;
  onPageChange: (page: number, pageSize: number) => void;
}

// ==========================================
// Component
// ==========================================

export const TicketListPanel: React.FC<TicketListPanelProps> = React.memo(function TicketListPanel({
  paginatedTickets,
  filteredCount,
  selectedTicketId,
  activeQuickTab,
  kpiFilter,
  currentPage,
  pageSize,
  onSelectTicket,
  onQuickTabChange,
  onClearKpiFilter,
  onBatchResolve,
  onBatchReassign,
  onBatchSelectionChange,
  onClearAllFilters,
  onPageChange,
}) {
  // Track batch-selected IDs from Carbon DataTable render prop
  const pendingSelectionRef = useRef<string[]>([]);
  const prevSelectionRef = useRef<string>('');

  useEffect(() => {
    const key = pendingSelectionRef.current.join(',');
    if (key !== prevSelectionRef.current) {
      prevSelectionRef.current = key;
      onBatchSelectionChange(pendingSelectionRef.current);
    }
  });

  return (
    <div className="tickets-split-view__list">
      {/* Quick Filter Tabs */}
      <div className="tickets-split-view__tabs">
        <ContentSwitcher
          onChange={(data) => {
            const tabName = QUICK_TAB_OPTIONS[data.index ?? 0];
            onQuickTabChange(tabName);
          }}
          selectedIndex={QUICK_TAB_OPTIONS.indexOf(activeQuickTab)}
          size="sm"
        >
          {QUICK_TAB_OPTIONS.map((tab) => (
            <Switch key={tab} name={tab} text={tab} />
          ))}
        </ContentSwitcher>
        {kpiFilter && (
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Close}
            hasIconOnly
            iconDescription="Clear KPI filter"
            onClick={onClearKpiFilter}
            className="tickets-split-view__clear-kpi"
          />
        )}
      </div>

      {/* DataTable with batch actions */}
      <DataTable
        rows={paginatedTickets.map((t) => ({ ...t, id: t.id }))}
        headers={TABLE_HEADERS}
        isSortable
      >
        {({
          rows,
          headers,
          getHeaderProps,
          getRowProps,
          getSelectionProps,
          getTableProps,
          getBatchActionProps,
          selectedRows,
        }) => {
          // Capture selection into ref (no state update during render)
          pendingSelectionRef.current = selectedRows.map((r) => r.id);

          return (
            <TableContainer className="tickets-split-view__table-container" aria-label="Ticket list with priority and status">
              <TableToolbar>
                <TableBatchActions {...getBatchActionProps()}>
                  <TableBatchAction
                    tabIndex={getBatchActionProps().shouldShowBatchActions ? 0 : -1}
                    renderIcon={Checkmark}
                    onClick={onBatchResolve}
                  >
                    Resolve
                  </TableBatchAction>
                  <TableBatchAction
                    tabIndex={getBatchActionProps().shouldShowBatchActions ? 0 : -1}
                    renderIcon={UserMultiple}
                    onClick={onBatchReassign}
                  >
                    Reassign
                  </TableBatchAction>
                </TableBatchActions>
                <TableToolbarContent>
                  <span className="tickets-split-view__count">
                    {filteredCount} ticket{filteredCount !== 1 ? 's' : ''}
                  </span>
                </TableToolbarContent>
              </TableToolbar>

              <Table {...getTableProps()} size="md">
                <TableHead>
                  <TableRow>
                    <TableSelectAll {...getSelectionProps()} />
                    {headers.map((header) => {
                      const { key: headerKey, ...headerProps } = getHeaderProps({ header });
                      return (
                        <TableHeader key={headerKey} {...headerProps}>
                          {header.header}
                        </TableHeader>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={headers.length + 1}>
                        <EmptyState
                          icon={Ticket}
                          title="No tickets found"
                          description="Try adjusting your filters or create a new ticket"
                          size="sm"
                          action={{
                            label: 'Clear Filters',
                            onClick: onClearAllFilters,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => {
                      const ticket = paginatedTickets.find((t) => t.id === row.id);
                      if (!ticket) return null;
                      const isSelected = selectedTicketId === ticket.id;
                      const { key: rowKey, ...rowProps } = getRowProps({ row });
                      return (
                        <TableRow
                          key={rowKey}
                          {...rowProps}
                          onClick={() => onSelectTicket(ticket.id)}
                          className={`tickets-split-view__row ${isSelected ? 'tickets-split-view__row--active' : ''}`}
                        >
                          <TableSelectRow {...getSelectionProps({ row })} />
                          <TableCell>
                            <span className="ticket-number">{ticket.ticketNumber}</span>
                          </TableCell>
                          <TableCell>
                            <div className="ticket-title-cell">
                              <span className="ticket-title">{ticket.title}</span>
                              {isLinkableAlertId(ticket.alertId) && (
                                <span className="ticket-alert-badge">
                                  <LinkIcon size={12} />
                                  {ticket.alertId}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getPriorityTag(ticket.priority)}</TableCell>
                          <TableCell>{getTicketStatusTag(ticket.status as 'open' | 'in-progress' | 'pending' | 'resolved' | 'closed')}</TableCell>
                          <TableCell>
                            <span className="timestamp">{formatRelativeTime(ticket.updatedAt || ticket.createdAt)}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          );
        }}
      </DataTable>

      <Pagination
        totalItems={filteredCount}
        pageSize={pageSize}
        pageSizes={[10, 20, 50]}
        page={currentPage}
        onChange={({ page, pageSize: ps }) => onPageChange(page, ps)}
      />
    </div>
  );
});
