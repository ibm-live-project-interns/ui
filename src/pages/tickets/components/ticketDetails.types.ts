/**
 * Copyright IBM Corp. 2026
 *
 * Ticket Details - Shared Types, Constants, and Helper Functions
 * Used by TicketDetailsPage and its child components.
 */

import type { TicketInfo } from '@/shared/services';

// ==========================================
// Types
// ==========================================

export interface EditFormData {
    title: string;
    description: string;
    priority: TicketInfo['priority'];
    status: TicketInfo['status'];
    assignedTo: string;
    alertId: string;
}

export interface AlertOption {
    id: string;
    label: string;
}

export interface AssigneeSelectOption {
    value: string;
    text: string;
}

// ==========================================
// Helper Functions
// ==========================================

/** Format a date string to readable format */
export function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

/** Format relative time */
export function timeAgo(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    } catch {
        return '';
    }
}
