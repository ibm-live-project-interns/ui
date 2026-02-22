/**
 * Copyright IBM Corp. 2026
 *
 * TicketActivitySection - Activity timeline displaying comments,
 * the ticket-created event, and the comment form.
 */

import React from 'react';
import {
    Tile,
    Button,
    SkeletonText,
    TextArea,
    Tag,
} from '@carbon/react';
import {
    Activity,
    Checkmark,
    Chat,
    Send,
} from '@carbon/icons-react';
import type { TicketInfo } from '@/shared/services';
import type { TicketComment } from '@/features/tickets/services/ticketService';
import { isLinkableAlertId } from './ticketHelpers';
import { formatDate, timeAgo } from './ticketDetails.types';

// ==========================================
// Types
// ==========================================

export interface TicketActivitySectionProps {
    ticket: TicketInfo;
    comments: TicketComment[];
    isLoadingComments: boolean;
    newComment: string;
    isSubmittingComment: boolean;
    onNewCommentChange: (value: string) => void;
    onAddComment: () => void;
}

// ==========================================
// Component
// ==========================================

export const TicketActivitySection: React.FC<TicketActivitySectionProps> = React.memo(
    function TicketActivitySection({
        ticket,
        comments,
        isLoadingComments,
        newComment,
        isSubmittingComment,
        onNewCommentChange,
        onAddComment,
    }) {
        return (
            <Tile className="ticket-card">
                <div className="ticket-card__header">
                    <Activity size={20} aria-label="Activity timeline" />
                    <h3 className="ticket-card__title">Activity Timeline</h3>
                    <Tag size="sm" type="gray" className="ticket-timeline__count-tag">
                        {comments.length} {comments.length === 1 ? 'entry' : 'entries'}
                    </Tag>
                </div>

                <div className="ticket-timeline">
                    {/* Real comments from API */}
                    {isLoadingComments ? (
                        <div className="ticket-timeline__loading">
                            <SkeletonText paragraph lineCount={3} />
                        </div>
                    ) : comments.length > 0 ? (
                        comments.map((comment) => (
                            <div key={comment.id} className="ticket-timeline__item">
                                <div className="ticket-timeline__icon">
                                    <Chat size={16} aria-label="Comment" />
                                </div>
                                <div className="ticket-timeline__content">
                                    <div className="ticket-timeline__meta">
                                        <p className="ticket-timeline__title">{comment.author}</p>
                                        <span className="ticket-timeline__timestamp">{timeAgo(comment.createdAt)}</span>
                                    </div>
                                    <p className="ticket-timeline__description">{comment.content}</p>
                                    <p className="ticket-timeline__timestamp">{formatDate(comment.createdAt)}</p>
                                </div>
                            </div>
                        ))
                    ) : null}

                    {/* Always show ticket created as last timeline entry */}
                    <div className="ticket-timeline__item">
                        <div className="ticket-timeline__icon ticket-timeline__icon--current">
                            <Checkmark size={16} aria-label="Ticket created" />
                        </div>
                        <div className="ticket-timeline__content">
                            <p className="ticket-timeline__title">Ticket Created</p>
                            <p className="ticket-timeline__description">
                                {isLinkableAlertId(ticket.alertId) ? `Created from alert ${ticket.alertId}` : 'Ticket created manually'}
                            </p>
                            <p className="ticket-timeline__timestamp">{formatDate(ticket.createdAt)}</p>
                        </div>
                    </div>
                </div>

                {/* Add Comment Form */}
                <div className="ticket-comment-form">
                    <TextArea
                        id="new-comment"
                        labelText="Add a comment"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => onNewCommentChange(e.target.value)}
                        rows={2}
                        className="ticket-comment-form__input"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                onAddComment();
                            }
                        }}
                    />
                    <Button
                        kind="primary"
                        size="md"
                        renderIcon={Send}
                        disabled={!newComment.trim() || isSubmittingComment}
                        onClick={onAddComment}
                        className="ticket-comment-form__submit"
                    >
                        {isSubmittingComment ? 'Sending...' : 'Send'}
                    </Button>
                </div>
            </Tile>
        );
    }
);
