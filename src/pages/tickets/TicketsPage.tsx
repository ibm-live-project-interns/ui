/**
 * Copyright IBM Corp. 2026
 *
 * TicketsPage - Split-View Ticket Management
 *
 * Professional split-view layout:
 * - Top: KPI bar with clickable metrics
 * - Left panel (7/12): Ticket list with batch actions + quick filters
 * - Right panel (5/12): Selected ticket detail with tabs (Overview | Activity | Related Alerts)
 *
 * Follows IBM Carbon Design System patterns.
 */

import { useNavigate } from 'react-router-dom';

import {
  DataTableSkeleton,
  Tile,
  SkeletonText,
} from '@carbon/react';
import {
  Add,
  Download,
  Ticket,
} from '@carbon/icons-react';

import { PageHeader, FilterBar, EmptyState } from '@/components';
import { PageLayout } from '@/components/layout';
import { ROUTES } from '@/shared/constants/routes';

// Child components and hooks
import {
  TicketDetailPanel,
  TicketKPIs,
  TicketListPanel,
  CreateTicketModal,
  ResolveTicketModal,
  ReassignTicketModal,
  useTicketData,
  useTicketFilters,
  useTicketActions,
} from './components';

import '@/styles/pages/_tickets.scss';

// ==========================================
// Component
// ==========================================

export function TicketsPage() {
  const navigate = useNavigate();

  // ----- Data -----
  const {
    tickets,
    isLoading,
    refetchTickets,
    ticketStats,
    alertsList,
    assigneeOptions,
  } = useTicketData();

  // ----- Filters & Pagination -----
  const {
    searchQuery,
    handleSearchChange,
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
  } = useTicketFilters(tickets);

  // ----- Actions & Modals -----
  const {
    selectedTicketId,
    selectedTicket,
    selectedTicketComments,
    isLoadingComments,
    detailTab,
    handleSelectTicket,
    setDetailTab,
    activityEntries,

    isCreateModalOpen,
    isCreating,
    createForm,
    setIsCreateModalOpen,
    setCreateForm,
    handleCreateTicket,

    isResolveModalOpen,
    isResolving,
    resolveNotes,
    setIsResolveModalOpen,
    setResolveNotes,
    handleResolveTicket,

    isReassignModalOpen,
    isReassigning,
    reassignTarget,
    setIsReassignModalOpen,
    setReassignTarget,
    handleBatchReassign,

    batchSelectedIds,
    setBatchSelectedIds,
    handleBatchResolve,

    handleExportCSV,
    handleAddComment,
  } = useTicketActions({
    tickets,
    paginatedTickets,
    assigneeOptions,
    refetchTickets,
  });

  // ----- Loading skeleton -----
  if (isLoading) {
    return (
      <PageLayout className="tickets-page">
        <PageHeader
          title="Tickets"
          subtitle="Manage, assign, and resolve incident tickets"
          showBreadcrumbs
          breadcrumbs={[
            { label: 'Home', href: ROUTES.DASHBOARD },
            { label: 'Tickets', active: true },
          ]}
          showBorder
        />
        <div className="kpi-row">
          {[1, 2, 3, 4].map((i) => (
            <Tile key={i} className="kpi-card-skeleton">
              <SkeletonText width="40%" />
              <SkeletonText heading width="50%" />
            </Tile>
          ))}
        </div>
        <DataTableSkeleton columnCount={5} rowCount={10} showHeader showToolbar />
      </PageLayout>
    );
  }

  return (
    <PageLayout className="tickets-page">
      <PageHeader
        title="Tickets"
        subtitle="Manage, assign, and resolve incident tickets"
        showBreadcrumbs
        breadcrumbs={[
          { label: 'Home', href: ROUTES.DASHBOARD },
          { label: 'Tickets', active: true },
        ]}
        showBorder
        actions={[
          {
            label: 'Export CSV',
            onClick: handleExportCSV,
            variant: 'ghost',
            icon: Download,
          },
          {
            label: 'Create Ticket',
            onClick: () => setIsCreateModalOpen(true),
            variant: 'primary',
            icon: Add,
          },
        ]}
      />

      {/* KPI Row */}
      <TicketKPIs
        tickets={tickets}
        ticketStats={ticketStats}
        kpiFilter={kpiFilter}
        onKPIClick={handleKPIClick}
      />

      {/* Filters */}
      <FilterBar
        searchEnabled
        searchPlaceholder="Search by ticket #, title, or device..."
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        dropdowns={filterDropdowns}
        onClearAll={clearAllFilters}
        totalCount={tickets.length}
        filteredCount={filteredTickets.length}
        itemLabel="tickets"
        className="tickets-page__filter-bar"
      />

      {/* Split-View Layout */}
      <div className="tickets-split-view">
        {/* Left Panel: Ticket List */}
        <TicketListPanel
          paginatedTickets={paginatedTickets}
          filteredCount={filteredTickets.length}
          selectedTicketId={selectedTicketId}
          activeQuickTab={activeQuickTab}
          kpiFilter={kpiFilter}
          currentPage={currentPage}
          pageSize={pageSize}
          onSelectTicket={handleSelectTicket}
          onQuickTabChange={handleQuickTabChange}
          onClearKpiFilter={clearKpiFilter}
          onBatchResolve={handleBatchResolve}
          onBatchReassign={() => setIsReassignModalOpen(true)}
          onBatchSelectionChange={setBatchSelectedIds}
          onClearAllFilters={clearAllFilters}
          onPageChange={handlePageChange}
        />

        {/* Right Panel: Ticket Detail */}
        <div className="tickets-split-view__detail">
          {selectedTicket ? (
            <TicketDetailPanel
              ticket={selectedTicket}
              comments={selectedTicketComments}
              isLoadingComments={isLoadingComments}
              activityEntries={activityEntries}
              detailTab={detailTab}
              onTabChange={setDetailTab}
              onResolve={() => setIsResolveModalOpen(true)}
              onAddComment={handleAddComment}
              onViewFull={() => navigate(`${ROUTES.TICKETS.replace(':id', '')}/${selectedTicket.id}`)}
            />
          ) : (
            <div className="tickets-split-view__no-selection">
              <EmptyState
                icon={Ticket}
                title="No ticket selected"
                description="Select a ticket from the list to view details"
                size="md"
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        isCreating={isCreating}
        formData={createForm}
        alertsList={alertsList}
        assigneeOptions={assigneeOptions}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTicket}
        onFormChange={(update) => setCreateForm((prev) => ({ ...prev, ...update }))}
      />

      <ResolveTicketModal
        isOpen={isResolveModalOpen}
        isResolving={isResolving}
        ticketNumber={selectedTicket?.ticketNumber || ''}
        resolveNotes={resolveNotes}
        onClose={() => {
          setIsResolveModalOpen(false);
          setResolveNotes('');
        }}
        onSubmit={() => {
          if (selectedTicketId) handleResolveTicket(selectedTicketId);
        }}
        onNotesChange={setResolveNotes}
      />

      <ReassignTicketModal
        isOpen={isReassignModalOpen}
        isReassigning={isReassigning}
        selectedCount={batchSelectedIds.length}
        reassignTarget={reassignTarget}
        assigneeOptions={assigneeOptions}
        onClose={() => {
          setIsReassignModalOpen(false);
          setReassignTarget('');
        }}
        onSubmit={handleBatchReassign}
        onTargetChange={setReassignTarget}
      />
    </PageLayout>
  );
}

export default TicketsPage;
