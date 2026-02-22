/**
 * Copyright IBM Corp. 2026
 *
 * SLA API Service - Handles all HTTP calls for the SLA reports page.
 */

import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';
import type { SLAOverview, SLAViolationsResponse, SLATrendResponse } from './sla.types';

class SLAService extends HttpService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath, 'SLA');
    }

    async getOverview(period: string): Promise<SLAOverview> {
        return this.request<SLAOverview>(`/reports/sla?period=${period}`);
    }

    async getViolations(period: string): Promise<SLAViolationsResponse> {
        return this.request<SLAViolationsResponse>(`/reports/sla/violations?period=${period}`);
    }

    async getTrend(period: string): Promise<SLATrendResponse> {
        return this.request<SLATrendResponse>(`/reports/sla/trend?period=${period}`);
    }
}

export const slaService = new SLAService();
