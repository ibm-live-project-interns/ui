/**
 * RunbookService - HTTP service for runbook CRUD operations.
 */

import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';
import { logger } from '@/shared/utils/logger';

import type { Runbook } from './RunbookCard';
import type { RunbookFormData } from './RunbookModals';
import type { RunbooksResponse } from './types';
import { DEFAULT_STATS } from './types';

class RunbookService extends HttpService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath, 'RunbookService');
    }

    async getRunbooks(params: {
        search?: string;
        category?: string;
        limit?: number;
        offset?: number;
    }): Promise<RunbooksResponse> {
        const queryParts: string[] = [];
        if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
        if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
        if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
        if (params.offset !== undefined) queryParts.push(`offset=${params.offset}`);

        const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        try {
            return await this.get<RunbooksResponse>(`/runbooks${query}`);
        } catch (error) {
            logger.warn('GET /runbooks not available, returning empty', error);
            return {
                runbooks: [],
                total: 0,
                stats: { ...DEFAULT_STATS },
            };
        }
    }

    async getRunbook(id: number): Promise<{ runbook: Runbook }> {
        return await this.get<{ runbook: Runbook }>(`/runbooks/${id}`);
    }

    async createRunbook(data: RunbookFormData): Promise<{ runbook: Runbook; message: string }> {
        return await this.post<{ runbook: Runbook; message: string }>('/runbooks', data);
    }

    async updateRunbook(id: number, data: RunbookFormData): Promise<{ runbook: Runbook; message: string }> {
        return await this.put<{ runbook: Runbook; message: string }>(`/runbooks/${id}`, data);
    }

    async deleteRunbook(id: number): Promise<{ message: string }> {
        return await this.delete<{ message: string }>(`/runbooks/${id}`);
    }
}

export const runbookService = new RunbookService();
