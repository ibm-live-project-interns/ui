/**
 * Copyright IBM Corp. 2026
 *
 * useDeviceGroups - Custom hook encapsulating all state, data-fetching, and
 * CRUD logic for the Device Groups page.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { logger } from '@/shared/utils/logger';
import { useFetchData } from '@/shared/hooks';
import {
    GroupObjectsNew,
    Devices as DevicesIcon,
    WarningAlt,
    ChartBubble,
} from '@carbon/icons-react';

import type { KPICardProps } from '@/components/ui/KPICard';
import { useToast } from '@/contexts';
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

import { EMPTY_FORM } from './deviceGroups.types';
import type { DeviceOption } from './deviceGroups.types';

// ==========================================
// Return type
// ==========================================

export interface UseDeviceGroupsReturn {
    // Data
    groups: DeviceGroup[];
    stats: DeviceGroupStats;
    isLoading: boolean;
    errorMessage: string;
    setErrorMessage: (msg: string) => void;
    allDevices: Device[];
    deviceOptions: DeviceOption[];

    // Search
    searchInput: string;
    setSearchInput: (value: string) => void;
    searchQuery: string;
    setSearchQuery: (value: string) => void;

    // KPI
    kpiData: KPICardProps[];

    // Modal state
    isCreateModalOpen: boolean;
    isDeleteModalOpen: boolean;
    editingGroup: DeviceGroup | null;
    deletingGroup: DeviceGroup | null;
    formData: CreateDeviceGroupRequest;
    formErrors: Record<string, string>;
    isSaving: boolean;
    isDeleting: boolean;

    // Actions
    fetchGroups: () => Promise<void>;
    handleOpenCreateModal: () => void;
    handleOpenEditModal: (group: DeviceGroup) => void;
    handleCloseCreateModal: () => void;
    handleSaveGroup: () => Promise<void>;
    handleOpenDeleteModal: (group: DeviceGroup) => void;
    handleCloseDeleteModal: () => void;
    handleConfirmDelete: () => Promise<void>;
    onFormChange: (data: CreateDeviceGroupRequest) => void;
}

// ==========================================
// Hook
// ==========================================

export function useDeviceGroups(): UseDeviceGroupsReturn {
    // Data state
    const [errorMessage, setErrorMessage] = useState('');

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

    const { data: groupsResult, isLoading, refetch: refetchGroups } = useFetchData(
        async (_signal) => {
            const response = await deviceGroupService.getAll(searchQuery || undefined);
            return {
                groups: response.device_groups || [] as DeviceGroup[],
                stats: response.stats,
            };
        },
        [searchQuery],
        {
            onError: (err) => {
                logger.error('Failed to fetch device groups', err);
                setErrorMessage('Failed to load device groups. Please try again.');
            },
        }
    );

    const groups = groupsResult?.groups ?? [];
    const stats: DeviceGroupStats = groupsResult?.stats ?? {
        total_groups: 0,
        total_devices: 0,
        ungrouped_devices: 0,
        largest_group: 'N/A',
        largest_count: 0,
    };

    const { data: allDevicesData } = useFetchData(
        async (_signal) => deviceService.getDevices(),
        [],
        { onError: (err) => logger.debug('Failed to fetch devices for group multi-select', err) }
    );

    const allDevices = allDevicesData ?? [];

    // Wrap refetchGroups as an async function matching the original fetchGroups signature
    const fetchGroups = useCallback(async () => {
        refetchGroups();
    }, [refetchGroups]);

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

    const handleOpenCreateModal = useCallback(() => {
        setEditingGroup(null);
        setFormData({ ...EMPTY_FORM });
        setFormErrors({});
        setIsCreateModalOpen(true);
    }, []);

    const handleOpenEditModal = useCallback((group: DeviceGroup) => {
        setEditingGroup(group);
        setFormData({
            name: group.name,
            description: group.description,
            color: group.color,
            device_ids: [...group.device_ids],
        });
        setFormErrors({});
        setIsCreateModalOpen(true);
    }, []);

    const handleCloseCreateModal = useCallback(() => {
        setIsCreateModalOpen(false);
        setEditingGroup(null);
        setFormData({ ...EMPTY_FORM });
        setFormErrors({});
        setIsSaving(false);
    }, []);

    const handleSaveGroup = useCallback(async () => {
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
            logger.error('Device group save failed', error);
            const msg = error instanceof Error ? error.message : 'Failed to save device group.';
            setErrorMessage(msg);
            addToast('error', 'Error', msg);
        } finally {
            setIsSaving(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, editingGroup, addToast, fetchGroups, handleCloseCreateModal]);

    // ==========================================
    // Delete
    // ==========================================

    const handleOpenDeleteModal = useCallback((group: DeviceGroup) => {
        setDeletingGroup(group);
        setIsDeleteModalOpen(true);
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(false);
        setDeletingGroup(null);
        setIsDeleting(false);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
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
            logger.error('Device group delete failed', error);
            const msg = error instanceof Error ? error.message : 'Failed to delete device group.';
            setErrorMessage(msg);
            addToast('error', 'Error', msg);
        } finally {
            setIsDeleting(false);
        }
    }, [deletingGroup, addToast, fetchGroups]);

    return {
        groups,
        stats,
        isLoading,
        errorMessage,
        setErrorMessage,
        allDevices,
        deviceOptions,
        searchInput,
        setSearchInput,
        searchQuery,
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
        onFormChange: setFormData,
    };
}
