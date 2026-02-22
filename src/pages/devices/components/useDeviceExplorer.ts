/**
 * Copyright IBM Corp. 2026
 *
 * useDeviceExplorer - Custom hook encapsulating all state, data-fetching,
 * filtering, and pagination logic for the Device Explorer page.
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceService } from '@/features/devices/services';
import type { Device, DeviceStats } from '@/shared/types';
import {
    DEVICE_TYPE_OPTIONS,
    DEVICE_STATUS_OPTIONS,
    DEVICE_LOCATION_OPTIONS,
} from '@/shared/constants';
import { env } from '@/shared/config';
import { logger } from '@/shared/utils/logger';
import { useFetchData } from '@/shared/hooks';
import type { DropdownFilterConfig } from '@/components/ui/FilterBar';

// ==========================================
// Return type
// ==========================================

export interface UseDeviceExplorerReturn {
    // Data
    devices: Device[];
    stats: DeviceStats;
    isLoading: boolean;

    // Filtering
    searchTerm: string;
    filteredDevices: Device[];
    paginatedDevices: Device[];

    // Pagination
    currentPage: number;
    pageSize: number;
    setCurrentPage: (page: number) => void;
    setPageSize: (size: number) => void;

    // Filter bar config
    filterDropdowns: DropdownFilterConfig[];
    clearAllFilters: () => void;
    onSearchChange: (value: string) => void;

    // Actions
    handleViewDevice: (deviceId: string) => void;
    handleRefresh: () => void;
    navigateToSettings: () => void;
}

// ==========================================
// Hook
// ==========================================

export function useDeviceExplorer(): UseDeviceExplorerReturn {
    const navigate = useNavigate();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [locationFilter, setLocationFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(env.maxAlertsPerPage);

    // ---- Data Fetching ----

    const { data: fetchResult, isLoading, refetch } = useFetchData(
        async (_signal) => {
            const [deviceData, statsData] = await Promise.all([
                deviceService.getDevices(),
                deviceService.getDeviceStats(),
            ]);
            return { devices: deviceData, stats: statsData };
        },
        [],
        {
            initialData: { devices: [] as Device[], stats: { online: 0, critical: 0, warning: 0, offline: 0, total: 0 } as DeviceStats },
            onError: (err) => logger.error('Failed to fetch devices', err),
        }
    );

    const devices = fetchResult?.devices ?? [];
    const stats = fetchResult?.stats ?? { online: 0, critical: 0, warning: 0, offline: 0, total: 0 };

    // ---- Filtering & Pagination ----

    const filteredDevices = useMemo(() => {
        return devices.filter(device => {
            if (searchTerm &&
                !(device.name || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
                !(device.ip || '').includes(searchTerm)) {
                return false;
            }
            if (typeFilter !== 'all' && device.type !== typeFilter) {
                return false;
            }
            if (statusFilter !== 'all' && device.status !== statusFilter) {
                return false;
            }
            if (locationFilter !== 'all' && !(device.location || '').toLowerCase().includes(locationFilter)) {
                return false;
            }
            return true;
        });
    }, [devices, searchTerm, typeFilter, statusFilter, locationFilter]);

    const paginatedDevices = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredDevices.slice(start, start + pageSize);
    }, [filteredDevices, currentPage, pageSize]);

    // ---- Handlers ----

    const handleViewDevice = useCallback((deviceId: string) => {
        navigate(`/devices/${deviceId}`);
    }, [navigate]);

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const navigateToSettings = useCallback(() => {
        navigate('/settings');
    }, [navigate]);

    const onSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, []);

    // ---- FilterBar config ----

    const filterDropdowns: DropdownFilterConfig[] = useMemo(() => [
        {
            id: 'type-filter',
            label: 'Type',
            options: DEVICE_TYPE_OPTIONS.map(o => ({ id: o.id, text: o.text })),
            selectedItem: DEVICE_TYPE_OPTIONS.find(t => t.id === typeFilter) || DEVICE_TYPE_OPTIONS[0],
            onChange: (item) => {
                setTypeFilter(item?.id || 'all');
                setCurrentPage(1);
            },
        },
        {
            id: 'location-filter',
            label: 'Location',
            options: DEVICE_LOCATION_OPTIONS.map(o => ({ id: o.id, text: o.text })),
            selectedItem: DEVICE_LOCATION_OPTIONS.find(l => l.id === locationFilter) || DEVICE_LOCATION_OPTIONS[0],
            onChange: (item) => {
                setLocationFilter(item?.id || 'all');
                setCurrentPage(1);
            },
        },
        {
            id: 'status-filter',
            label: 'Status',
            options: DEVICE_STATUS_OPTIONS.map(o => ({ id: o.id, text: o.text })),
            selectedItem: DEVICE_STATUS_OPTIONS.find(s => s.id === statusFilter) || DEVICE_STATUS_OPTIONS[0],
            onChange: (item) => {
                setStatusFilter(item?.id || 'all');
                setCurrentPage(1);
            },
        },
    ], [typeFilter, locationFilter, statusFilter]);

    const clearAllFilters = useCallback(() => {
        setSearchTerm('');
        setTypeFilter('all');
        setStatusFilter('all');
        setLocationFilter('all');
        setCurrentPage(1);
    }, []);

    return {
        devices,
        stats,
        isLoading,
        searchTerm,
        filteredDevices,
        paginatedDevices,
        currentPage,
        pageSize,
        setCurrentPage,
        setPageSize,
        filterDropdowns,
        clearAllFilters,
        onSearchChange,
        handleViewDevice,
        handleRefresh,
        navigateToSettings,
    };
}
