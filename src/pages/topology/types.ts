/**
 * Topology Page Types & Shared Constants
 *
 * Shared interfaces, constants, and helpers used across topology sub-components.
 */

import React from 'react';
import {
    Router,
    Network_2 as Network2,
    Security,
    ServerDns,
    WifiSecure,
    CircleFilled,
    Warning,
    CheckmarkFilled,
    ErrorFilled,
} from '@carbon/icons-react';

import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';
import { logger } from '@/shared/utils/logger';

// ==========================================
// Types
// ==========================================

export interface TopologyNode {
    id: string;
    label: string;
    type: 'router' | 'switch' | 'firewall' | 'server' | 'access-point';
    status: 'online' | 'offline' | 'warning';
    ip: string;
    location: string;
}

export interface TopologyEdge {
    source: string;
    target: string;
    bandwidth: string;
    utilization: number;
    status: 'active' | 'degraded' | 'down';
}

export interface TopologyResponse {
    nodes: TopologyNode[];
    edges: TopologyEdge[];
    locations: string[];
}

export interface FilterOption {
    id: string;
    text: string;
}

// ==========================================
// Topology API Service
// ==========================================

class TopologyService extends HttpService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath, 'TopologyService');
    }

    async getTopology(): Promise<TopologyResponse> {
        try {
            return await this.get<TopologyResponse>('/topology');
        } catch (error) {
            logger.warn('GET /topology not available, returning empty', error);
            return { nodes: [], edges: [], locations: [] };
        }
    }
}

export const topologyService = new TopologyService();

// ==========================================
// Constants
// ==========================================

export const DEVICE_TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    router: Router,
    switch: Network2,
    firewall: Security,
    server: ServerDns,
    'access-point': WifiSecure,
};

export const DEVICE_TYPE_LABELS: Record<string, string> = {
    router: 'Router',
    switch: 'Switch',
    firewall: 'Firewall',
    server: 'Server',
    'access-point': 'Access Point',
};

export const STATUS_COLORS: Record<string, string> = {
    online: '#24a148',
    offline: '#da1e28',
    warning: '#f1c21b',
    active: '#24a148',
    degraded: '#f1c21b',
    down: '#da1e28',
};

export const STATUS_TAG_TYPES: Record<string, 'green' | 'red' | 'warm-gray'> = {
    active: 'green',
    degraded: 'warm-gray',
    down: 'red',
};

export const LOCATION_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Locations' },
];

export const TYPE_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Types' },
    { id: 'router', text: 'Router' },
    { id: 'switch', text: 'Switch' },
    { id: 'firewall', text: 'Firewall' },
    { id: 'server', text: 'Server' },
    { id: 'access-point', text: 'Access Point' },
];

export const STATUS_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Statuses' },
    { id: 'online', text: 'Online' },
    { id: 'offline', text: 'Offline' },
    { id: 'warning', text: 'Warning' },
];

export const CONNECTION_HEADERS = [
    { key: 'source', header: 'Source' },
    { key: 'target', header: 'Target' },
    { key: 'bandwidth', header: 'Bandwidth' },
    { key: 'utilization', header: 'Utilization' },
    { key: 'status', header: 'Status' },
];

// ==========================================
// Helpers
// ==========================================

export function getUtilizationColor(utilization: number): string {
    if (utilization >= 80) return '#da1e28';
    if (utilization >= 60) return '#f1c21b';
    return '#24a148';
}

export function getStatusIcon(status: string) {
    switch (status) {
        case 'online':
        case 'active':
            return CheckmarkFilled;
        case 'offline':
        case 'down':
            return ErrorFilled;
        case 'warning':
        case 'degraded':
            return Warning;
        default:
            return CircleFilled;
    }
}

export function getNodeLabel(nodeId: string, nodes: TopologyNode[]): string {
    const node = nodes.find((n) => n.id === nodeId);
    return node ? node.label : nodeId;
}
