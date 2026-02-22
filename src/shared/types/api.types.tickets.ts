/**
 * Copyright IBM Corp. 2026
 *
 * Ticket API Types
 *
 * These types mirror the backend Go ticket models exactly.
 * Any changes to backend models MUST be reflected here.
 *
 * Source files:
 * - ingestor/shared/models/ticket.go
 */

// ==========================================
// Ticket Types (from models/ticket.go)
// ==========================================

/** Ticket priority levels */
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';

/** Ticket status values */
export type TicketStatus = 'open' | 'in-progress' | 'pending' | 'resolved' | 'closed';

/** Ticket from API */
export interface Ticket {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  assignee?: string;
  reporter: string;
  alert_id?: string;
  device_id?: string;
  due_date?: string;
  resolved_at?: string;
  tags: string[];
}

/** Create ticket request */
export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
  category: string;
  alert_id?: string;
  device_id?: string;
  assignee?: string;
  tags?: string[];
}

/** Update ticket request */
export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  category?: string;
  assignee?: string;
  tags?: string[];
}

/** Ticket comment */
export interface TicketComment {
  id: string;
  created_at: string;
  updated_at: string;
  ticket_id: string;
  author: string;
  content: string;
}
