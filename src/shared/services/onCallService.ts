/**
 * Copyright IBM Corp. 2026
 *
 * On-Call Service
 *
 * Provides CRUD operations for on-call schedules and overrides.
 * Uses the shared HttpService base class for authenticated API communication.
 *
 * Endpoints:
 *   GET    /on-call/schedules     - list schedules (paginated, filterable)
 *   POST   /on-call/schedules     - create schedule
 *   PUT    /on-call/schedules/:id - update schedule
 *   DELETE /on-call/schedules/:id - delete schedule (cascades overrides)
 *   POST   /on-call/overrides     - create override
 *   DELETE /on-call/overrides/:id - delete override
 *   GET    /on-call/current       - get current on-call person
 */

import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';
import { logger } from '@/shared/utils/logger';

// ==========================================
// Types
// ==========================================

export interface OnCallSchedule {
  id: number;
  user_id: number;
  username: string;
  start_time: string;
  end_time: string;
  rotation_type: string;
  is_primary: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OnCallOverride {
  id: number;
  schedule_id: number;
  original_user_id: number;
  override_user_id: number;
  start_time: string;
  end_time: string;
  reason: string;
  created_by: string;
  created_at: string;
}

export interface CreateScheduleRequest {
  user_id?: number;
  username: string;
  start_time: string;
  end_time: string;
  rotation_type?: string;
  is_primary?: boolean;
}

export interface CreateOverrideRequest {
  schedule_id: number;
  original_user_id?: number;
  override_user_id?: number;
  start_time: string;
  end_time: string;
  reason?: string;
}

export interface SchedulesResponse {
  schedules: OnCallSchedule[];
  total: number;
}

export interface CurrentOnCallResponse {
  on_call: Array<{
    id: number;
    name: string;
    role: string;
    team: string;
    email: string;
    phone: string;
    shift_type: string;
    start_time: string;
    end_time: string;
    status: string;
  }>;
  total: number;
  timestamp: string;
}

// ==========================================
// Service Interface
// ==========================================

export interface IOnCallService {
  getSchedules(params?: {
    page?: number;
    limit?: number;
    rotation_type?: string;
    username?: string;
  }): Promise<SchedulesResponse>;
  createSchedule(data: CreateScheduleRequest): Promise<{ message: string; schedule?: OnCallSchedule }>;
  updateSchedule(id: number, data: Partial<CreateScheduleRequest>): Promise<{ message: string; schedule?: OnCallSchedule }>;
  deleteSchedule(id: number): Promise<{ message: string }>;
  createOverride(data: CreateOverrideRequest): Promise<{ message: string; override?: OnCallOverride }>;
  deleteOverride(id: number): Promise<{ message: string }>;
  getCurrentOnCall(): Promise<CurrentOnCallResponse>;
}

// ==========================================
// API Implementation
// ==========================================

class ApiOnCallService extends HttpService implements IOnCallService {
  constructor() {
    const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
    const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
    super(apiPath, 'OnCallService');
  }

  async getSchedules(params?: {
    page?: number;
    limit?: number;
    rotation_type?: string;
    username?: string;
  }): Promise<SchedulesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.page && params?.limit) {
      searchParams.set('offset', String((params.page - 1) * params.limit));
    }
    if (params?.rotation_type) searchParams.set('rotation_type', params.rotation_type);
    if (params?.username) searchParams.set('username', params.username);

    const query = searchParams.toString();
    const endpoint = `/on-call/schedules${query ? `?${query}` : ''}`;

    try {
      return await this.get<SchedulesResponse>(endpoint);
    } catch (error) {
      logger.warn('GET /on-call/schedules not available', error);
      return { schedules: [], total: 0 };
    }
  }

  async createSchedule(data: CreateScheduleRequest): Promise<{ message: string; schedule?: OnCallSchedule }> {
    return await this.post<{ message: string; schedule?: OnCallSchedule }>('/on-call/schedules', data);
  }

  async updateSchedule(id: number, data: Partial<CreateScheduleRequest>): Promise<{ message: string; schedule?: OnCallSchedule }> {
    return await this.put<{ message: string; schedule?: OnCallSchedule }>(`/on-call/schedules/${id}`, data);
  }

  async deleteSchedule(id: number): Promise<{ message: string }> {
    return await this.delete<{ message: string }>(`/on-call/schedules/${id}`);
  }

  async createOverride(data: CreateOverrideRequest): Promise<{ message: string; override?: OnCallOverride }> {
    return await this.post<{ message: string; override?: OnCallOverride }>('/on-call/overrides', data);
  }

  async deleteOverride(id: number): Promise<{ message: string }> {
    return await this.delete<{ message: string }>(`/on-call/overrides/${id}`);
  }

  async getCurrentOnCall(): Promise<CurrentOnCallResponse> {
    try {
      return await this.get<CurrentOnCallResponse>('/on-call/current');
    } catch (error) {
      logger.warn('GET /on-call/current not available', error);
      return { on_call: [], total: 0, timestamp: new Date().toISOString() };
    }
  }
}

// ==========================================
// Singleton Export
// ==========================================

export const onCallService: IOnCallService = new ApiOnCallService();
