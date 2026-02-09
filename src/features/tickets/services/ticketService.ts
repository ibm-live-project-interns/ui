/**
 * Ticket Data Service
 *
 * Unified data layer for ticket operations.
 * Persists tickets in localStorage for mock mode, API for production.
 * Uses centralized API_ENDPOINTS - no hardcoded paths.
 */

import { env, API_ENDPOINTS } from '@/shared/config';
import { HttpService } from '@/shared/api';

export interface TicketInfo {
    id: string;
    ticketNumber: string;
    alertId: string;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    assignedTo: string;
    createdAt: string;
    updatedAt: string;
    deviceName: string;
}

export interface CreateTicketData {
    alertId: string;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    deviceName?: string;
    assignee?: string;
}

export interface TicketComment {
    id: string;
    ticketId: string;
    author: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface TicketStats {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    by_priority: Record<string, number>;
    by_category: Record<string, number>;
    avg_resolution_hours: number;
}

export interface ITicketDataService {
    getTickets(): Promise<TicketInfo[]>;
    getTicketById(id: string): Promise<TicketInfo | null>;
    createTicket(data: CreateTicketData): Promise<TicketInfo>;
    updateTicket(id: string, data: Partial<TicketInfo>): Promise<TicketInfo>;
    deleteTicket(id: string): Promise<void>;
    getComments(ticketId: string): Promise<TicketComment[]>;
    addComment(ticketId: string, content: string): Promise<TicketComment>;
    getStats(): Promise<TicketStats>;
}

// Initial mock tickets
const INITIAL_TICKETS: TicketInfo[] = [
    {
        id: 'ticket-001',
        ticketNumber: 'TKT-2024-0001',
        alertId: 'pa-001',
        title: 'Interface GigabitEthernet1/0/24 Down',
        description: 'Critical link failure detected on Core-SW-01. Multiple interfaces experiencing connectivity issues.',
        priority: 'critical',
        status: 'open',
        assignedTo: 'John Doe',
        createdAt: '2024-01-16 14:25:00',
        updatedAt: '2024-01-16 14:25:00',
        deviceName: 'Core-SW-01',
    },
    {
        id: 'ticket-002',
        ticketNumber: 'TKT-2024-0002',
        alertId: 'pa-004',
        title: 'High CPU Utilization on Firewall',
        description: 'Firewall processing load exceeding normal thresholds. May indicate DDoS attack.',
        priority: 'high',
        status: 'in-progress',
        assignedTo: 'Jane Smith',
        createdAt: '2024-01-16 14:10:00',
        updatedAt: '2024-01-16 14:30:00',
        deviceName: 'FW-DMZ-03',
    },
    {
        id: 'ticket-003',
        ticketNumber: 'TKT-2024-0003',
        alertId: 'pa-005',
        title: 'BGP Session Flapping',
        description: 'BGP neighbor experiencing unstable connection. Session torn down multiple times.',
        priority: 'high',
        status: 'resolved',
        assignedTo: 'Mike Johnson',
        createdAt: '2024-01-16 14:05:00',
        updatedAt: '2024-01-16 14:45:00',
        deviceName: 'RTR-EDGE-05',
    },
    {
        id: 'ticket-004',
        ticketNumber: 'TKT-2024-0004',
        alertId: 'pa-006',
        title: 'Port Security Violation',
        description: 'Unauthorized MAC address detected on secured port.',
        priority: 'medium',
        status: 'closed',
        assignedTo: 'Sarah Williams',
        createdAt: '2024-01-16 13:55:00',
        updatedAt: '2024-01-16 14:20:00',
        deviceName: 'SW-ACCESS-12',
    },
];

// ==========================================
// Mock Implementation (with localStorage persistence)
// ==========================================

class MockTicketDataService implements ITicketDataService {
    private readonly STORAGE_KEY = 'noc_tickets';
    private ticketCounter = 5; // Start after initial tickets

    private getStoredTickets(): TicketInfo[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return [...INITIAL_TICKETS];
            }
        }
        // Initialize with mock data
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
        return [...INITIAL_TICKETS];
    }

    private saveTickets(tickets: TicketInfo[]): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tickets));
    }

    private simulateDelay(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, 100));
    }

    private generateTicketNumber(): string {
        const year = new Date().getFullYear();
        const num = String(this.ticketCounter++).padStart(4, '0');
        return `TKT-${year}-${num}`;
    }

    async getTickets(): Promise<TicketInfo[]> {
        await this.simulateDelay();
        return this.getStoredTickets();
    }

    async getTicketById(id: string): Promise<TicketInfo | null> {
        await this.simulateDelay();
        const tickets = this.getStoredTickets();
        return tickets.find(t => t.id === id) || null;
    }

    async createTicket(data: CreateTicketData): Promise<TicketInfo> {
        await this.simulateDelay();

        const tickets = this.getStoredTickets();
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

        const newTicket: TicketInfo = {
            id: `ticket-${Date.now()}`,
            ticketNumber: this.generateTicketNumber(),
            alertId: data.alertId,
            title: data.title,
            description: data.description,
            priority: data.priority,
            status: 'open',
            assignedTo: data.assignee || 'Unassigned',
            createdAt: now,
            updatedAt: now,
            deviceName: data.deviceName || 'Unknown Device',
        };

        tickets.unshift(newTicket); // Add to beginning
        this.saveTickets(tickets);

        console.log('[MockTicketService] Created ticket:', newTicket);
        return newTicket;
    }

    async updateTicket(id: string, data: Partial<TicketInfo>): Promise<TicketInfo> {
        await this.simulateDelay();

        const tickets = this.getStoredTickets();
        const index = tickets.findIndex(t => t.id === id);

        if (index === -1) {
            throw new Error('Ticket not found');
        }

        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        tickets[index] = {
            ...tickets[index],
            ...data,
            updatedAt: now,
        };

        this.saveTickets(tickets);
        return tickets[index];
    }

    async deleteTicket(id: string): Promise<void> {
        await this.simulateDelay();

        const tickets = this.getStoredTickets();
        const filtered = tickets.filter(t => t.id !== id);
        this.saveTickets(filtered);
    }

    async getComments(ticketId: string): Promise<TicketComment[]> {
        await this.simulateDelay();
        const now = new Date();
        return [
            {
                id: `cmt-${ticketId}-1`,
                ticketId,
                author: 'John Smith',
                content: 'Initial investigation started. Checking network logs for anomalies.',
                createdAt: new Date(now.getTime() - 3600000).toISOString(),
                updatedAt: new Date(now.getTime() - 3600000).toISOString(),
            },
            {
                id: `cmt-${ticketId}-2`,
                ticketId,
                author: 'Jane Doe',
                content: 'Found potential root cause. Interface flapping detected on port Gi0/1.',
                createdAt: new Date(now.getTime() - 1800000).toISOString(),
                updatedAt: new Date(now.getTime() - 1800000).toISOString(),
            },
        ];
    }

    async addComment(ticketId: string, content: string): Promise<TicketComment> {
        await this.simulateDelay();
        const now = new Date().toISOString();
        return {
            id: `cmt-${Date.now()}`,
            ticketId,
            author: 'Current User',
            content,
            createdAt: now,
            updatedAt: now,
        };
    }

    async getStats(): Promise<TicketStats> {
        await this.simulateDelay();
        const tickets = this.getStoredTickets();
        const open = tickets.filter(t => t.status === 'open').length;
        const inProgress = tickets.filter(t => t.status === 'in-progress').length;
        const resolved = tickets.filter(t => t.status === 'resolved').length;
        const closed = tickets.filter(t => t.status === 'closed').length;
        return {
            total: tickets.length,
            open,
            in_progress: inProgress,
            resolved,
            closed,
            by_priority: {},
            by_category: {},
            avg_resolution_hours: 2.5,
        };
    }
}

// ==========================================
// API Implementation
// ==========================================

class ApiTicketDataService extends HttpService implements ITicketDataService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath);
    }

    async getTickets(): Promise<TicketInfo[]> {
        // Backend returns array directly, not { tickets: [...] }
        const response = await this.get<any>(API_ENDPOINTS.TICKETS);
        const tickets = Array.isArray(response) ? response : (response.tickets || []);
        // Transform snake_case to camelCase if needed
        return tickets.map((t: any) => ({
            id: t.id,
            ticketNumber: t.ticketNumber || t.ticket_number,
            alertId: t.alertId || t.alert_id || '',
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: t.status,
            assignedTo: t.assignedTo || t.assigned_to || t.assignee || 'Unassigned',
            createdAt: t.createdAt || t.created_at,
            updatedAt: t.updatedAt || t.updated_at,
            deviceName: t.deviceName || t.device_name || 'Unknown',
        }));
    }

    async getTicketById(id: string): Promise<TicketInfo | null> {
        try {
            const response = await this.get<any>(API_ENDPOINTS.TICKET_BY_ID(id));
            const ticket = response.ticket || response;
            return this.transformTicket(ticket);
        } catch {
            console.warn('[TicketService] Failed to fetch ticket by ID:', id);
            return null;
        }
    }

    /** Transform snake_case backend ticket to camelCase frontend TicketInfo */
    private transformTicket(t: any): TicketInfo {
        return {
            id: t.id,
            ticketNumber: t.ticketNumber || t.ticket_number || t.id,
            alertId: t.alertId || t.alert_id || '',
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: t.status,
            assignedTo: t.assignedTo || t.assigned_to || t.assignee || 'Unassigned',
            createdAt: t.createdAt || t.created_at,
            updatedAt: t.updatedAt || t.updated_at,
            deviceName: t.deviceName || t.device_name || t.device_id || 'Unknown',
        };
    }

    async createTicket(data: CreateTicketData): Promise<TicketInfo> {
        // Transform camelCase frontend fields to snake_case backend contract
        const payload = {
            title: data.title,
            description: data.description,
            priority: data.priority,
            category: data.priority, // Use priority as category fallback since UI doesn't have a category field
            alert_id: data.alertId || undefined,
            device_id: data.deviceName || undefined, // Backend expects device_id, UI has deviceName
            assignee: data.assignee || undefined,
        };
        console.log('[TicketService] Creating ticket with payload:', payload);
        const response = await this.post<any>(API_ENDPOINTS.TICKETS, payload);
        // Transform response back to camelCase
        const ticket = response.ticket || response;
        return this.transformTicket(ticket);
    }

    async updateTicket(id: string, data: Partial<TicketInfo>): Promise<TicketInfo> {
        // Transform camelCase update fields to snake_case
        const payload: Record<string, unknown> = {};
        if (data.title !== undefined) payload.title = data.title;
        if (data.description !== undefined) payload.description = data.description;
        if (data.priority !== undefined) payload.priority = data.priority;
        if (data.status !== undefined) payload.status = data.status;
        if (data.assignedTo !== undefined) payload.assignee = data.assignedTo;
        if (data.alertId !== undefined) payload.alert_id = data.alertId;
        console.log('[TicketService] Updating ticket %s with payload:', id, payload);
        const response = await this.put<any>(API_ENDPOINTS.TICKET_BY_ID(id), payload);
        const ticket = response.ticket || response;
        return this.transformTicket(ticket);
    }

    async deleteTicket(id: string): Promise<void> {
        return this.delete<void>(API_ENDPOINTS.TICKET_BY_ID(id));
    }

    async getComments(ticketId: string): Promise<TicketComment[]> {
        try {
            const response = await this.get<any>(API_ENDPOINTS.TICKET_COMMENTS(ticketId));
            const comments = Array.isArray(response) ? response : (response.comments || []);
            return comments.map((c: any) => ({
                id: c.id || c.ID,
                ticketId: c.ticket_id || c.ticketId || ticketId,
                author: c.author,
                content: c.content,
                createdAt: c.created_at || c.createdAt,
                updatedAt: c.updated_at || c.updatedAt,
            }));
        } catch {
            console.warn('[TicketService] Failed to fetch comments for ticket:', ticketId);
            return [];
        }
    }

    async addComment(ticketId: string, content: string): Promise<TicketComment> {
        const response = await this.post<any>(API_ENDPOINTS.TICKET_COMMENTS(ticketId), { content });
        const comment = response.comment || response;
        return {
            id: comment.id || comment.ID,
            ticketId: comment.ticket_id || comment.ticketId || ticketId,
            author: comment.author,
            content: comment.content,
            createdAt: comment.created_at || comment.createdAt,
            updatedAt: comment.updated_at || comment.updatedAt,
        };
    }

    async getStats(): Promise<TicketStats> {
        try {
            const response = await this.get<any>(API_ENDPOINTS.TICKET_STATS);
            return {
                total: response.total ?? 0,
                open: response.open ?? 0,
                in_progress: response.in_progress ?? 0,
                resolved: response.resolved ?? 0,
                closed: response.closed ?? 0,
                by_priority: response.by_priority ?? {},
                by_category: response.by_category ?? {},
                avg_resolution_hours: response.avg_resolution_hours ?? 0,
            };
        } catch {
            console.warn('[TicketService] Failed to fetch ticket stats');
            return {
                total: 0,
                open: 0,
                in_progress: 0,
                resolved: 0,
                closed: 0,
                by_priority: {},
                by_category: {},
                avg_resolution_hours: 0,
            };
        }
    }
}

// ==========================================
// Service Factory
// ==========================================

function createTicketDataService(): ITicketDataService {
    if (env.useMockData) {
        console.info('[TicketDataService] Using mock data');
        return new MockTicketDataService();
    }
    console.info('[TicketDataService] Using API:', env.apiBaseUrl);
    return new ApiTicketDataService();
}

// Export singleton instance
export const ticketDataService = createTicketDataService();
