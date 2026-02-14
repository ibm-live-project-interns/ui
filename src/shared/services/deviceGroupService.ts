/**
 * Copyright IBM Corp. 2026
 *
 * Device Group Service
 *
 * Provides CRUD operations for device groups (logical groupings of network devices).
 * Uses the shared HttpService base class for authenticated API communication.
 */

import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';

// ==========================================
// Types
// ==========================================

export interface DeviceGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  device_ids: string[];
  device_count: number;
  created_at: string;
  updated_at: string;
}

export interface DeviceGroupStats {
  total_groups: number;
  total_devices: number;
  ungrouped_devices: number;
  largest_group: string;
  largest_count: number;
}

export interface DeviceGroupsResponse {
  device_groups: DeviceGroup[];
  total: number;
  stats: DeviceGroupStats;
}

export interface CreateDeviceGroupRequest {
  name: string;
  description: string;
  color: string;
  device_ids: string[];
}

// ==========================================
// Service
// ==========================================

class DeviceGroupService extends HttpService {
  constructor() {
    const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
    const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
    super(apiPath, 'DeviceGroupService');
  }

  async getAll(search?: string): Promise<DeviceGroupsResponse> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    try {
      return await this.get<DeviceGroupsResponse>(`/device-groups${query}`);
    } catch (error) {
      console.warn('[DeviceGroupService] GET /device-groups not available, returning empty:', error);
      return {
        device_groups: [],
        total: 0,
        stats: {
          total_groups: 0,
          total_devices: 0,
          ungrouped_devices: 0,
          largest_group: 'N/A',
          largest_count: 0,
        },
      };
    }
  }

  async getById(id: string): Promise<{ device_group: DeviceGroup }> {
    return await this.get<{ device_group: DeviceGroup }>(`/device-groups/${id}`);
  }

  async create(data: CreateDeviceGroupRequest): Promise<{ device_group: DeviceGroup; message: string }> {
    return await this.post<{ device_group: DeviceGroup; message: string }>('/device-groups', data);
  }

  async update(id: string, data: Partial<CreateDeviceGroupRequest>): Promise<{ device_group: DeviceGroup; message: string }> {
    return await this.put<{ device_group: DeviceGroup; message: string }>(`/device-groups/${id}`, data);
  }

  async remove(id: string): Promise<{ message: string }> {
    return await this.delete<{ message: string }>(`/device-groups/${id}`);
  }

  async addDevices(groupId: string, deviceIds: string[]): Promise<{ device_group: DeviceGroup; message: string }> {
    return await this.post<{ device_group: DeviceGroup; message: string }>(
      `/device-groups/${groupId}/devices`,
      { device_ids: deviceIds }
    );
  }

  async removeDevice(groupId: string, deviceId: string): Promise<{ message: string }> {
    return await this.delete<{ message: string }>(`/device-groups/${groupId}/devices/${deviceId}`);
  }
}

export const deviceGroupService = new DeviceGroupService();
