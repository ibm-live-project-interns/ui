/**
 * Copyright IBM Corp. 2026
 *
 * Audit Log API Service
 * Handles all HTTP calls for the audit log page.
 */

import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';
import { logger } from '@/shared/utils/logger';
import type { AuditLogEntry, AuditLogStats } from './audit-log.types';

// ==========================================
// Types
// ==========================================

export interface AuditLogResponse {
    audit_logs: AuditLogEntry[];
    total: number;
    stats: AuditLogStats;
}

export interface AuditLogQueryParams {
    search?: string;
    action?: string;
    resource?: string;
    username?: string;
    result?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
}

// ==========================================
// Service
// ==========================================

class AuditLogService extends HttpService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath, 'AuditLogService');
    }

    async getAuditLogs(params: AuditLogQueryParams): Promise<AuditLogResponse> {
        const queryParts: string[] = [];
        if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
        if (params.action) queryParts.push(`action=${encodeURIComponent(params.action)}`);
        if (params.resource) queryParts.push(`resource=${encodeURIComponent(params.resource)}`);
        if (params.username) queryParts.push(`username=${encodeURIComponent(params.username)}`);
        if (params.result) queryParts.push(`result=${encodeURIComponent(params.result)}`);
        if (params.start_date) queryParts.push(`start_date=${encodeURIComponent(params.start_date)}`);
        if (params.end_date) queryParts.push(`end_date=${encodeURIComponent(params.end_date)}`);
        if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
        if (params.offset !== undefined) queryParts.push(`offset=${params.offset}`);

        const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        try {
            return await this.get<AuditLogResponse>(`/audit-logs${query}`);
        } catch (error) {
            logger.warn('GET /audit-logs not available, returning empty', error);
            return {
                audit_logs: [],
                total: 0,
                stats: {
                    total_actions_24h: 0,
                    failed_actions_24h: 0,
                    active_users_24h: 0,
                    most_active_user: 'N/A',
                    most_active_user_actions: 0,
                },
            };
        }
    }

    async getActions(): Promise<string[]> {
        try {
            const response = await this.get<{ actions: string[] }>('/audit-logs/actions');
            return response.actions || [];
        } catch (err) {
            logger.warn('Failed to fetch audit log actions', err);
            return [];
        }
    }
}

export const auditLogService = new AuditLogService();
