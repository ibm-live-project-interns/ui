/**
 * Copyright IBM Corp. 2026
 *
 * TicketInfoPanel - The main ticket information panel showing description,
 * device, assignee, dates, and linked alert.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Tile } from '@carbon/react';
import { Ticket } from '@carbon/icons-react';
import type { TicketInfo } from '@/shared/services';
import { isLinkableAlertId } from './ticketHelpers';
import { formatDate } from './ticketDetails.types';

// ==========================================
// Types
// ==========================================

export interface TicketInfoPanelProps {
    ticket: TicketInfo;
}

// ==========================================
// Component
// ==========================================

export const TicketInfoPanel: React.FC<TicketInfoPanelProps> = React.memo(
    function TicketInfoPanel({ ticket }) {
        return (
            <Tile className="ticket-card">
                <div className="ticket-card__header">
                    <Ticket size={20} aria-label="Ticket details" />
                    <h3 className="ticket-card__title">Ticket Details</h3>
                </div>

                <div className="ticket-card__section">
                    <h4 className="ticket-card__section-title">Description</h4>
                    <p className="ticket-card__text">{ticket.description}</p>
                </div>

                <div className="ticket-card__rows">
                    <div className="ticket-card__row">
                        <span className="ticket-card__label">Device</span>
                        <span className="ticket-card__value">{ticket.deviceName}</span>
                    </div>
                    <div className="ticket-card__row">
                        <span className="ticket-card__label">Assigned To</span>
                        <span className="ticket-card__value">{ticket.assignedTo || 'Unassigned'}</span>
                    </div>
                    <div className="ticket-card__row">
                        <span className="ticket-card__label">Created</span>
                        <span className="ticket-card__value">{formatDate(ticket.createdAt)}</span>
                    </div>
                    <div className="ticket-card__row">
                        <span className="ticket-card__label">Last Updated</span>
                        <span className="ticket-card__value">{formatDate(ticket.updatedAt)}</span>
                    </div>
                    {ticket.alertId && (
                        <div className="ticket-card__row">
                            <span className="ticket-card__label">Related Alert</span>
                            {isLinkableAlertId(ticket.alertId) ? (
                                <Link to={`/alerts/${ticket.alertId}`} className="ticket-card__value ticket-card__value--link">
                                    {ticket.alertId}
                                </Link>
                            ) : (
                                <span className="ticket-card__value">{ticket.alertId}</span>
                            )}
                        </div>
                    )}
                </div>
            </Tile>
        );
    }
);
