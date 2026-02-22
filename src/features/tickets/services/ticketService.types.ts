/**
 * Ticket Data Service - Type Definitions
 *
 * All interfaces, types, and backend response shapes used by the ticket service.
 * Separated from implementation for clean dependency management.
 */

// ==========================================
// Public Types (exported to consumers)
// ==========================================

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
    category?: string;
    deviceId?: string;
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

// ==========================================
// Backend Response Shapes (snake_case from Go API)
// ==========================================

/** Raw ticket shape from the backend API (may use snake_case or camelCase) */
export interface RawTicketFromAPI {
    id: string;
    ticketNumber?: string;
    ticket_number?: string;
    alertId?: string;
    alert_id?: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    assignedTo?: string;
    assigned_to?: string;
    assignee?: string;
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
    deviceName?: string;
    device_name?: string;
    device_id?: string;
}

/** Response from the tickets list endpoint */
export interface TicketsListResponse {
    tickets?: RawTicketFromAPI[];
}

/** Response from a single ticket endpoint */
export interface SingleTicketResponse {
    ticket?: RawTicketFromAPI;
    [key: string]: unknown;
}

/** Raw comment shape from backend API */
export interface RawCommentFromAPI {
    id?: string;
    ID?: string;
    ticket_id?: string;
    ticketId?: string;
    author: string;
    content: string;
    created_at?: string;
    createdAt?: string;
    updated_at?: string;
    updatedAt?: string;
}

/** Response from the comments endpoint */
export interface CommentsListResponse {
    comments?: RawCommentFromAPI[];
}

/** Response from the add comment endpoint */
export interface AddCommentResponse {
    comment?: RawCommentFromAPI;
    [key: string]: unknown;
}
