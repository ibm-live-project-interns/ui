/**
 * Copyright IBM Corp. 2026
 *
 * Device Groups - Shared Types, Constants, and Helper Functions
 * Used by DeviceGroupsPage and its child components.
 */

import type { CreateDeviceGroupRequest } from '@/shared/services/deviceGroupService';
import type { Device } from '@/shared/types';

// ==========================================
// Types
// ==========================================

export interface FilterOption {
    id: string;
    text: string;
}

export interface DeviceOption {
    id: string;
    text: string;
}

// ==========================================
// Constants
// ==========================================

/** Preset color options for group color picker */
export const COLOR_OPTIONS: FilterOption[] = [
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

export const EMPTY_FORM: CreateDeviceGroupRequest = {
    name: '',
    description: '',
    color: '#4589ff',
    device_ids: [],
};

// ==========================================
// Helpers
// ==========================================

/** Get the display name for a device ID using loaded device list, or fall back to the raw ID. */
export function getDeviceDisplayName(deviceId: string, devices: Device[]): string {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : deviceId;
}
