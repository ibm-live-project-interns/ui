/**
 * Copyright IBM Corp. 2026
 *
 * Runbooks & Knowledge Base Page
 * Displays operational runbooks for common network incidents.
 * Supports searching, filtering by category, creating/editing runbooks,
 * and viewing full runbook detail with numbered steps.
 *
 * State management: useRunbooks hook
 * Child components: RunbookCard, CreateEditRunbookModal, ViewRunbookModal,
 *                   DeleteRunbookModal, RunbooksLoadingSkeleton
 */

import {
    Tile,
    InlineNotification,
} from '@carbon/react';
import {
    Add,
    Renew,
    DocumentBlank,
} from '@carbon/icons-react';

import { KPICard, PageHeader, EmptyState, FilterBar } from '@/components';
import { PageLayout } from '@/components/layout';
import { ROUTES } from '@/shared/constants/routes';

import {
    RunbookCard,
    CreateEditRunbookModal,
    ViewRunbookModal,
    DeleteRunbookModal,
    RunbooksLoadingSkeleton,
    useRunbooks,
} from './components';

import '@/styles/components/_kpi-card.scss';
import '@/styles/pages/_runbooks.scss';

// ==========================================
// Component
// ==========================================

export function RunbooksPage() {
    const {
        runbooks,
        stats,
        isLoading,
        errorMessage,
        setErrorMessage,
        searchInput,
        setSearchInput,
        setSearchQuery,
        selectedCategory,
        searchQuery,
        filterDropdowns,
        clearAllFilters,
        kpiData,
        isCreateModalOpen,
        isDetailModalOpen,
        isDeleteModalOpen,
        editingRunbook,
        viewingRunbook,
        deletingRunbook,
        formData,
        stepIds,
        formErrors,
        isSaving,
        isDeleting,
        fetchRunbooks,
        handleOpenCreateModal,
        handleOpenEditModal,
        handleCloseCreateModal,
        handleSaveRunbook,
        handleAddStep,
        handleRemoveStep,
        handleStepChange,
        handleViewRunbook,
        handleCloseDetailModal,
        handleOpenDeleteModal,
        handleConfirmDelete,
        handleCloseDeleteModal,
        onFormChange,
    } = useRunbooks();

    // Loading Skeleton
    if (isLoading && runbooks.length === 0) {
        return <RunbooksLoadingSkeleton />;
    }

    return (
        <PageLayout>
        <div className="runbooks-page">
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: ROUTES.DASHBOARD },
                    { label: 'Runbooks', active: true },
                ]}
                title="Runbooks & Knowledge Base"
                subtitle="Operational procedures and troubleshooting guides for common network incidents"
                showBorder
                actions={[
                    {
                        label: 'Refresh',
                        onClick: fetchRunbooks,
                        variant: 'secondary',
                        icon: Renew,
                    },
                    {
                        label: 'Create Runbook',
                        onClick: handleOpenCreateModal,
                        variant: 'primary',
                        icon: Add,
                    },
                ]}
            />

            <div className="runbooks-page__content">
                {errorMessage && (
                    <InlineNotification
                        kind="error"
                        title="Error"
                        subtitle={errorMessage}
                        onCloseButtonClick={() => setErrorMessage('')}
                        className="runbooks-page__notification"
                    />
                )}

                <div className="kpi-row">
                    {kpiData.map((kpi) => (
                        <KPICard key={kpi.id} {...kpi} />
                    ))}
                </div>

                <FilterBar
                    searchEnabled
                    searchPlaceholder="Search runbooks by title, description, or author..."
                    searchValue={searchInput}
                    onSearchChange={(value) => {
                        setSearchInput(value);
                        if (!value) setSearchQuery('');
                    }}
                    dropdowns={filterDropdowns}
                    onClearAll={clearAllFilters}
                    totalCount={stats.total_runbooks}
                    filteredCount={runbooks.length}
                    itemLabel="runbooks"
                />

                {runbooks.length === 0 && !isLoading ? (
                    <Tile className="runbooks-page__empty-state">
                        <EmptyState
                            icon={DocumentBlank}
                            title="No runbooks found"
                            description={
                                searchQuery || selectedCategory.id !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'Get started by creating your first runbook.'
                            }
                            size="lg"
                            action={
                                !searchQuery && selectedCategory.id === 'all'
                                    ? { label: 'Create Runbook', onClick: handleOpenCreateModal }
                                    : undefined
                            }
                        />
                    </Tile>
                ) : (
                    <div className="runbooks-page__grid" role="list" aria-label="Runbooks">
                        {runbooks.map((runbook) => (
                            <div key={runbook.id} role="listitem">
                                <RunbookCard
                                    runbook={runbook}
                                    onView={handleViewRunbook}
                                    onEdit={handleOpenEditModal}
                                    onDelete={handleOpenDeleteModal}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateEditRunbookModal
                isOpen={isCreateModalOpen}
                isSaving={isSaving}
                editingRunbook={editingRunbook}
                formData={formData}
                stepIds={stepIds}
                formErrors={formErrors}
                onClose={handleCloseCreateModal}
                onSubmit={handleSaveRunbook}
                onFormChange={onFormChange}
                onStepChange={handleStepChange}
                onAddStep={handleAddStep}
                onRemoveStep={handleRemoveStep}
            />

            <ViewRunbookModal
                isOpen={isDetailModalOpen}
                runbook={viewingRunbook}
                onClose={handleCloseDetailModal}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
            />

            <DeleteRunbookModal
                isOpen={isDeleteModalOpen}
                isDeleting={isDeleting}
                runbook={deletingRunbook}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
            />
        </div>
        </PageLayout>
    );
}

export default RunbooksPage;
