/**
 * Copyright IBM Corp. 2026
 *
 * Post-Mortem Service
 *
 * Provides operations for listing and updating post-mortem reports.
 * Uses the shared HttpService base class for authenticated API communication.
 *
 * Endpoints:
 *   GET /post-mortems      - list all post-mortems (paginated, searchable, filterable)
 *   PUT /post-mortems/:id  - update a post-mortem
 */

import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';
import { logger } from '@/shared/utils/logger';

// ==========================================
// Types
// ==========================================

export interface TimelineEntry {
  time: string;
  event: string;
}

export interface ActionItem {
  item: string;
  assignee: string;
  status: string;
}

export interface PostMortem {
  id: number;
  alert_id: number;
  title: string;
  root_cause: string;
  root_cause_category: string;
  impact_description: string;
  timeline: TimelineEntry[] | string;
  action_items: ActionItem[] | string;
  prevention_measures: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PostMortemsResponse {
  post_mortems: PostMortem[];
  total: number;
}

export interface UpdatePostMortemRequest {
  title?: string;
  root_cause?: string;
  root_cause_category?: string;
  impact_description?: string;
  timeline?: TimelineEntry[];
  action_items?: ActionItem[];
  prevention_measures?: string;
  status?: string;
}

// ==========================================
// Service Interface
// ==========================================

export interface IPostMortemService {
  list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
  }): Promise<PostMortemsResponse>;
  update(id: number, data: UpdatePostMortemRequest): Promise<{ message: string; post_mortem?: PostMortem }>;
}

// ==========================================
// API Implementation
// ==========================================

class ApiPostMortemService extends HttpService implements IPostMortemService {
  constructor() {
    const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
    const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
    super(apiPath, 'PostMortemService');
  }

  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
  }): Promise<PostMortemsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.page && params?.limit) {
      searchParams.set('offset', String((params.page - 1) * params.limit));
    }
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.category) searchParams.set('category', params.category);

    const query = searchParams.toString();
    const endpoint = `/post-mortems${query ? `?${query}` : ''}`;

    try {
      return await this.get<PostMortemsResponse>(endpoint);
    } catch (error) {
      logger.warn('GET /post-mortems not available', error);
      return { post_mortems: [], total: 0 };
    }
  }

  async update(id: number, data: UpdatePostMortemRequest): Promise<{ message: string; post_mortem?: PostMortem }> {
    return await this.put<{ message: string; post_mortem?: PostMortem }>(`/post-mortems/${id}`, data);
  }
}

// ==========================================
// Singleton Export
// ==========================================

export const postMortemService: IPostMortemService = new ApiPostMortemService();
