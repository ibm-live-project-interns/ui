/**
 * Copyright IBM Corp. 2026
 *
 * Device Groups Management Page
 *
 * Allows organizing network devices into logical groups (e.g. "Core Network", "DMZ",
 * "Floor 3 WiFi"). Supports full CRUD with search, color-coded cards, and device
 * multi-select for group membership.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Tile,
    Tag,
    Modal,
    TextInput,
    TextArea,
    Search,
    SkeletonText,
    InlineNotification,
    Dropdown,
    FilterableMultiSelect,
} from '@carbon/react';
import {
    Add,
    Edit,
    TrashCan,
    Renew,
    GroupObjectsNew,
    Devices as DevicesIcon,
    WarningAlt,
    ChartBubble,
} from '@carbon/icons-react';

// Reusable components
import { KPICard, PageHeader, EmptyState } from '@/components';
import type { KPICardProps } from '@/components/ui/KPICard';

// Services
import {
    deviceGroupService,
} from '@/shared/services/deviceGroupService';
import type {
    DeviceGroup,
    DeviceGroupStats,
    CreateDeviceGroupRequest,
} from '@/shared/services/deviceGroupService';
import { deviceService } from '@/shared/services';
import type { Device } from '@/shared/types';

// Config
import { ROUTES } from '@/shared/constants/routes';

// Toast context
import { useToast } from '@/contexts';

// Styles
import '@/styles/components/_kpi-card.scss';
import '@/styles/pages/_device-groups.scss';

// ==========================================
// Types & Constants
// ==========================================

interface FilterOption {
    id: string;
    text: string;
}

interface DeviceOption {
    id: string;
    text: string;
}

/** Preset color options for group color picker */
const COLOR_OPTIONS: FilterOption[] = [
    { id: '#4589ff', text: 'Blue' },
    { id: '#da1e28', text: 'Red' },
    { id: '#198038', text: 'Green' },
    { id: '#8a3ffc', text: 'Purple' },
    { id: '#ee5396', text: 'Pink' },
    { id: '#f1c21b', text: 'Yellow' },
    { id: '#005d5d', text: 'Teal' },
    { id: '#fa4d56', text: 'Coral' },
    { id: '#6929c4', text: 'Violet' },
    { id: '#1192e8', text: 'Cyan' },
];

const EMPTY_FORM: CreateDeviceGroupRequest = {
    name: '',
    description: '',
    color: '#4589ff',
    device_ids: [],
};

// ==========================================
// Helpers
// ==========================================

/** Get the display name for a device ID using loaded device list, or fall back to the raw ID. */
function getDeviceDisplayName(deviceId: string, devices: Device[]): string {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : deviceId;
}

// ==========================================
// Component
// ==========================================

export function DeviceGroupsPage() {
    // Data state
    const [groups, setGroups] = useState<DeviceGroup[]>([]);
    const [stats, setStats] = useState<DeviceGroupStats>({
        total_groups: 0,
        total_devices: 0,
        ungrouped_devices: 0,
        largest_group: 'N/A',
        largest_count: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    // Device list for multi-select
    const [allDevices, setAllDevices] = useState<Device[]>([]);

    // Search
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setSearchQuery(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<DeviceGroup | null>(null);
    const [deletingGroup, setDeletingGroup] = useState<DeviceGroup | null>(null);
    const [formData, setFormData] = useState<CreateDeviceGroupRequest>({ ...EMPTY_FORM });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast
    const { addToast } = useToast();

    // ==========================================
    // Data Fetching
    // ==========================================

    const fetchGroups = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const response = await deviceGroupService.getAll(searchQuery || undefined);
            setGroups(response.device_groups || []);
            if (response.stats) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('[DeviceGroupsPage] Failed to fetch device groups:', error);
            setErrorMessage('Failed to load device groups. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    const fetchDevices = useCallback(async () => {
        try {
            const devices = await deviceService.getDevices();
            setAllDevices(devices);
        } catch (error) {
            console.debug('[DeviceGroupsPage] Failed to fetch devices:', error);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const doFetch = async () => {
            if (!isMounted) return;
            await fetchGroups();
        };
        doFetch();
        return () => { isMounted = false; };
    }, [fetchGroups]);

    // Fetch device list once on mount for the multi-select
    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    // ==========================================
    // KPI Data
    // ==========================================

    const kpiData = useMemo((): KPICardProps[] => [
        {
            id: 'total-groups',
            label: 'Total Groups',
            value: stats.total_groups,
            icon: GroupObjectsNew,
            iconColor: '#0f62fe',
            severity: 'info' as const,
            subtitle: 'Logical device groupings',
        },
        {
            id: 'total-devices',
            label: 'Grouped Devices',
            value: stats.total_devices,
            icon: DevicesIcon,
            iconColor: '#198038',
            severity: 'success' as const,
            subtitle: 'Devices assigned to groups',
        },
        {
            id: 'ungrouped-devices',
            label: 'Ungrouped Devices',
            value: stats.ungrouped_devices,
            icon: WarningAlt,
            iconColor: stats.ungrouped_devices > 0 ? '#f1c21b' : '#198038',
            severity: stats.ungrouped_devices > 0 ? 'warning' as const : 'success' as const,
            subtitle: stats.ungrouped_devices > 0 ? 'Devices without a group' : 'All devices assigned',
        },
        {
            id: 'largest-group',
            label: 'Largest Group',
            value: stats.largest_count,
            icon: ChartBubble,
            iconColor: '#8a3ffc',
            severity: 'neutral' as const,
            subtitle: stats.largest_group || 'N/A',
        },
    ], [stats]);

    // ==========================================
    // Device options for multi-select
    // ==========================================

    const deviceOptions: DeviceOption[] = useMemo(() => {
        return allDevices.map(d => ({
            id: d.id,
            text: `${d.name} (${d.ip})`,
        }));
    }, [allDevices]);

    // ==========================================
    // Form Handling
    // ==========================================

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'Group name is required';
        } else if (formData.name.trim().length > 100) {
            errors.name = 'Group name must be 100 characters or less';
        }

        if (!formData.color) {
            errors.color = 'Color is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleOpenCreateModal = () => {
        setEditingGroup(null);
        setFormData({ ...EMPTY_FORM });
        setFormErrors({});
        setIsCreateModalOpen(true);
    };

    const handleOpenEditModal = (group: DeviceGroup) => {
        setEditingGroup(group);
        setFormData({
            name: group.name,
            description: group.description,
            color: group.color,
            device_ids: [...group.device_ids],
        });
        setFormErrors({});
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        setEditingGroup(null);
        setFormData({ ...EMPTY_FORM });
        setFormErrors({});
        setIsSaving(false);
    };

    const handleSaveGroup = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        setErrorMessage('');
        try {
            const cleanedData: CreateDeviceGroupRequest = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                color: formData.color,
                device_ids: formData.device_ids,
            };

            if (editingGroup) {
                await deviceGroupService.update(editingGroup.id, cleanedData);
                addToast('success', 'Group updated', `"${cleanedData.name}" has been updated.`);
            } else {
                await deviceGroupService.create(cleanedData);
                addToast('success', 'Group created', `"${cleanedData.name}" has been created.`);
            }

            handleCloseCreateModal();
            await fetchGroups();
        } catch (error) {
            console.error('[DeviceGroupsPage] Save failed:', error);
            const msg = error instanceof Error ? error.message : 'Failed to save device group.';
            setErrorMessage(msg);
            addToast('error', 'Error', msg);
        } finally {
            setIsSaving(false);
        }
    };

    // ==========================================
    // Delete
    // ==========================================

    const handleOpenDeleteModal = (group: DeviceGroup) => {
        setDeletingGroup(group);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingGroup) return;

        setIsDeleting(true);
        setErrorMessage('');
        try {
            await deviceGroupService.remove(deletingGroup.id);
            setIsDeleteModalOpen(false);
            addToast('success', 'Group deleted', `"${deletingGroup.name}" has been deleted.`);
            setDeletingGroup(null);
            await fetchGroups();
        } catch (error) {
            console.error('[DeviceGroupsPage] Delete failed:', error);
            const msg = error instanceof Error ? error.message : 'Failed to delete device group.';
            setErrorMessage(msg);
            addToast('error', 'Error', msg);
        } finally {
            setIsDeleting(false);
        }
    };

    // ==========================================
    // Loading Skeleton
    // ==========================================

    if (isLoading && groups.length === 0) {
        return (
            <div className="device-groups-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Home', href: ROUTES.DASHBOARD },
                        { label: 'Device Groups', active: true },
                    ]}
                    title="Device Groups"
                    subtitle="Loading group data..."
                    showBorder
                />

                <div className="device-groups-page__content">
                    <div className="kpi-row">
                        {[1, 2, 3, 4].map((i) => (
                            <Tile key={i} className="kpi-card-skeleton">
                                <SkeletonText width="60%" />
                                <SkeletonText heading width="40%" />
                                <SkeletonText width="80%" />
                            </Tile>
                        ))}
                    </div>

                    <div className="device-groups-page__grid">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Tile key={i} className="device-groups-page__card-skeleton">
                                <SkeletonText width="70%" />
                                <SkeletonText width="40%" />
                                <SkeletonText width="90%" />
                                <SkeletonText width="60%" />
                            </Tile>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // Render
    // ==========================================

    return (
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
                    <div className="device-groups-page__grid">
                        {groups.map((group) => (
                            <Tile key={group.id} className="device-groups-page__card">
                                {/* Colored top border */}
                                <div
                                    className="device-groups-page__card-border"
                                    style={{ backgroundColor: group.color || '#4589ff' }}
                                />

                                <div className="device-groups-page__card-body">
                                    {/* Header: Title + Actions */}
                                    <div className="device-groups-page__card-header">
                                        <div className="device-groups-page__card-title-section">
                                            <h4 className="device-groups-page__card-title">{group.name}</h4>
                                            {group.description && (
                                                <p className="device-groups-page__card-description">
                                                    {group.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="device-groups-page__card-actions">
                                            <button
                                                type="button"
                                                className="device-groups-page__icon-btn"
                                                title="Edit group"
                                                aria-label="Edit group"
                                                onClick={() => handleOpenEditModal(group)}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="device-groups-page__icon-btn device-groups-page__icon-btn--danger"
                                                title="Delete group"
                                                aria-label="Delete group"
                                                onClick={() => handleOpenDeleteModal(group)}
                                            >
                                                <TrashCan size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Device count badge */}
                                    <div className="device-groups-page__card-count">
                                        <Tag type="high-contrast" size="sm">
                                            {group.device_ids.length} device{group.device_ids.length !== 1 ? 's' : ''}
                                        </Tag>
                                    </div>

                                    {/* Device names list */}
                                    {group.device_ids.length > 0 && (
                                        <div className="device-groups-page__card-devices">
                                            {group.device_ids.slice(0, 5).map((deviceId) => (
                                                <Tag
                                                    key={deviceId}
                                                    type="cool-gray"
                                                    size="sm"
                                                    className="device-groups-page__card-device-tag"
                                                >
                                                    {getDeviceDisplayName(deviceId, allDevices)}
                                                </Tag>
                                            ))}
                                            {group.device_ids.length > 5 && (
                                                <span className="device-groups-page__card-more">
                                                    +{group.device_ids.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Tile>
                        ))}
                    </div>
                )}
            </div>

            {/* ==========================================
                Create / Edit Device Group Modal
                ========================================== */}
            <Modal
                open={isCreateModalOpen}
                onRequestClose={handleCloseCreateModal}
                onRequestSubmit={handleSaveGroup}
                modalHeading={editingGroup ? 'Edit Device Group' : 'Create Device Group'}
                primaryButtonText={isSaving ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}
                secondaryButtonText="Cancel"
                primaryButtonDisabled={isSaving}
                size="md"
                hasScrollingContent
            >
                <div className="device-groups-page__form">
                    <TextInput
                        id="group-name"
                        labelText="Group Name"
                        placeholder="e.g., Core Network, Floor 3 WiFi"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        invalid={!!formErrors.name}
                        invalidText={formErrors.name}
                        maxLength={100}
                    />

                    <TextArea
                        id="group-description"
                        labelText="Description"
                        placeholder="Describe the purpose or scope of this device group..."
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        rows={3}
                    />

                    <div className="device-groups-page__form-color-preview">
                        <div
                            className="device-groups-page__form-color-swatch"
                            style={{ backgroundColor: formData.color }}
                        />
                        <Dropdown
                            id="group-color"
                            titleText="Color"
                            label="Select a color"
                            items={COLOR_OPTIONS}
                            itemToString={(item: FilterOption | null) => item?.text || ''}
                            selectedItem={COLOR_OPTIONS.find(c => c.id === formData.color) || COLOR_OPTIONS[0]}
                            onChange={({ selectedItem }: { selectedItem: FilterOption | null }) => {
                                if (selectedItem) {
                                    setFormData((prev) => ({ ...prev, color: selectedItem.id }));
                                }
                            }}
                            invalid={!!formErrors.color}
                            invalidText={formErrors.color}
                        />
                    </div>

                    <FilterableMultiSelect
                        id="group-devices"
                        titleText="Devices"
                        placeholder="Search and select devices..."
                        items={deviceOptions}
                        itemToString={(item: DeviceOption) => item?.text || ''}
                        initialSelectedItems={deviceOptions.filter(d =>
                            formData.device_ids.includes(d.id)
                        )}
                        onChange={({ selectedItems }: { selectedItems: DeviceOption[] }) => {
                            setFormData((prev) => ({
                                ...prev,
                                device_ids: selectedItems.map(item => item.id),
                            }));
                        }}
                        selectionFeedback="top-after-reopen"
                    />
                </div>
            </Modal>

            {/* ==========================================
                Delete Confirmation Modal
                ========================================== */}
            <Modal
                open={isDeleteModalOpen}
                onRequestClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingGroup(null);
                    setIsDeleting(false);
                }}
                onRequestSubmit={handleConfirmDelete}
                danger
                modalHeading="Delete Device Group"
                primaryButtonText={isDeleting ? 'Deleting...' : 'Delete'}
                primaryButtonDisabled={isDeleting}
                secondaryButtonText="Cancel"
                size="sm"
            >
                <p className="device-groups-page__delete-info">
                    Are you sure you want to delete the group{' '}
                    <strong>{deletingGroup?.name}</strong>? This will not delete the devices
                    themselves, only the group assignment. This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
}

export default DeviceGroupsPage;
