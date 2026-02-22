/**
 * Copyright IBM Corp. 2026
 *
 * Device Groups Management Page
 *
 * Allows organizing network devices into logical groups (e.g. "Core Network", "DMZ",
 * "Floor 3 WiFi"). Supports full CRUD with search, color-coded cards, and device
 * multi-select for group membership.
 *
 * State management: useDeviceGroups hook
 * Child components: GroupCard, GroupFormModal, DeleteGroupModal, GroupsSkeleton
 */

import {
    Tile,
    Search,
    InlineNotification,
} from '@carbon/react';
import {
    Add,
    Renew,
    GroupObjectsNew,
} from '@carbon/icons-react';

// Reusable components
import { KPICard, PageHeader, EmptyState } from '@/components';
import { PageLayout } from '@/components/layout';

// Child components + hook
import {
    GroupCard,
    GroupFormModal,
    DeleteGroupModal,
    GroupsSkeleton,
    useDeviceGroups,
} from './components';

// Config
import { ROUTES } from '@/shared/constants/routes';

// Styles
import '@/styles/components/_kpi-card.scss';
import '@/styles/pages/_device-groups.scss';

// ==========================================
// Component
// ==========================================

export function DeviceGroupsPage() {
    const {
        groups,
        isLoading,
        errorMessage,
        setErrorMessage,
        allDevices,
        deviceOptions,
        searchInput,
        setSearchInput,
        setSearchQuery,
        kpiData,
        isCreateModalOpen,
        isDeleteModalOpen,
        editingGroup,
        deletingGroup,
        formData,
        formErrors,
        isSaving,
        isDeleting,
        fetchGroups,
        handleOpenCreateModal,
        handleOpenEditModal,
        handleCloseCreateModal,
        handleSaveGroup,
        handleOpenDeleteModal,
        handleCloseDeleteModal,
        handleConfirmDelete,
        onFormChange,
        searchQuery,
    } = useDeviceGroups();

    // Loading Skeleton
    if (isLoading && groups.length === 0) {
        return <GroupsSkeleton />;
    }

    return (
        <PageLayout>
        <div className="device-groups-page">
            {/* Page Header */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: ROUTES.DASHBOARD },
                    { label: 'Device Groups', active: true },
                ]}
                title="Device Groups"
                subtitle="Organize network devices into logical groups for easier management and monitoring"
                showBorder
                actions={[
                    {
                        label: 'Refresh',
                        onClick: fetchGroups,
                        variant: 'secondary',
                        icon: Renew,
                    },
                    {
                        label: 'Create Group',
                        onClick: handleOpenCreateModal,
                        variant: 'primary',
                        icon: Add,
                    },
                ]}
            />

            <div className="device-groups-page__content">
                {/* Error Banner */}
                {errorMessage && (
                    <InlineNotification
                        kind="error"
                        title="Error"
                        subtitle={errorMessage}
                        onCloseButtonClick={() => setErrorMessage('')}
                        className="device-groups-page__notification"
                    />
                )}

                {/* KPI Row */}
                <div className="kpi-row">
                    {kpiData.map((kpi) => (
                        <KPICard key={kpi.id} {...kpi} />
                    ))}
                </div>

                {/* Search Bar */}
                <div className="device-groups-page__search-bar">
                    <Search
                        size="lg"
                        placeholder="Search groups by name or description..."
                        labelText="Search device groups"
                        value={searchInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setSearchInput(e.target.value);
                        }}
                        onClear={() => {
                            setSearchInput('');
                            setSearchQuery('');
                        }}
                    />
                </div>

                {/* Group Cards Grid */}
                {groups.length === 0 && !isLoading ? (
                    <Tile className="device-groups-page__empty-state">
                        <EmptyState
                            icon={GroupObjectsNew}
                            title="No device groups found"
                            description={
                                searchQuery
                                    ? 'Try adjusting your search criteria.'
                                    : 'Get started by creating your first device group.'
                            }
                            size="lg"
                            action={
                                !searchQuery
                                    ? { label: 'Create Group', onClick: handleOpenCreateModal }
                                    : undefined
                            }
                        />
                    </Tile>
                ) : (
                    <div className="device-groups-page__grid" role="list" aria-label="Device groups">
                        {groups.map((group) => (
                            <div key={group.id} role="listitem">
                                <GroupCard
                                    group={group}
                                    allDevices={allDevices}
                                    onEdit={handleOpenEditModal}
                                    onDelete={handleOpenDeleteModal}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Device Group Modal */}
            <GroupFormModal
                open={isCreateModalOpen}
                editingGroup={editingGroup}
                formData={formData}
                formErrors={formErrors}
                isSaving={isSaving}
                deviceOptions={deviceOptions}
                onFormChange={onFormChange}
                onClose={handleCloseCreateModal}
                onSubmit={handleSaveGroup}
            />

            {/* Delete Confirmation Modal */}
            <DeleteGroupModal
                open={isDeleteModalOpen}
                group={deletingGroup}
                isDeleting={isDeleting}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
            />
        </div>
        </PageLayout>
    );
}

export default DeviceGroupsPage;
