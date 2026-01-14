/**
 * Ticket Data Service
 *
 * Unified data layer for ticket operations.
 * Persists tickets in localStorage for mock mode, API for production.
 */

import { env } from '@/config';
import { HttpService } from './HttpService';

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

export interface ITicketDataService {
    getTickets(): Promise<TicketInfo[]>;
    getTicketById(id: string): Promise<TicketInfo | null>;
    createTicket(data: CreateTicketData): Promise<TicketInfo>;
    updateTicket(id: string, data: Partial<TicketInfo>): Promise<TicketInfo>;
    deleteTicket(id: string): Promise<void>;
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
}

// ==========================================
// API Implementation
// ==========================================

class ApiTicketDataService extends HttpService implements ITicketDataService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        // Build URL: baseUrl + /api/v1
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath);
    }

    async getTickets(): Promise<TicketInfo[]> {
        return this.get<TicketInfo[]>('/tickets');
    }

    async getTicketById(id: string): Promise<TicketInfo | null> {
        try {
            return await this.get<TicketInfo>(`/tickets/${id}`);
        } catch {
            return null;
        }
    }

    async createTicket(data: CreateTicketData): Promise<TicketInfo> {
        return this.post<TicketInfo>('/tickets', data);
    }

    async updateTicket(id: string, data: Partial<TicketInfo>): Promise<TicketInfo> {
        return this.put<TicketInfo>(`/tickets/${id}`, data);
    }

    async deleteTicket(id: string): Promise<void> {
        return this.delete<void>(`/tickets/${id}`);
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
