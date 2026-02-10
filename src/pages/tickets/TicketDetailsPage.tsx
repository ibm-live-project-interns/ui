import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Tile,
    Button,
    SkeletonText,
    InlineNotification,
    Modal,
    TextInput,
    TextArea,
    Select,
    SelectItem,
    ComboBox,
    Tag,
} from '@carbon/react';
import {
    Edit, View, Time, Ticket, User, Activity, ArrowLeft, Checkmark,
    Chat, Send, TrashCan,
} from '@carbon/icons-react';
import '@/styles/pages/_ticket-details.scss';

// Services
import { ticketDataService, alertDataService, type TicketInfo } from '@/shared/services';
import type { TicketComment } from '@/features/tickets/services/ticketService';
import { userService } from '@/shared/services';
import { KPICard } from '@/components';
import { PageHeader } from '@/components/ui';
import { useToast } from '@/contexts';

/**
 * Returns true if the alertId represents a real backend alert that can be navigated to.
 * Filters out empty strings and synthetic "manual-" prefix IDs that were generated
 * client-side when creating tickets without a linked alert.
 */
function isLinkableAlertId(alertId: string | undefined | null): alertId is string {
    if (!alertId) return false;
    if (alertId.startsWith('manual-')) return false;
    return true;
}

export function TicketDetailsPage() {
    const { ticketId } = useParams<{ ticketId: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [ticket, setTicket] = useState<TicketInfo | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [alertsList, setAlertsList] = useState<{ id: string; label: string }[]>([]);
    const [assigneeOptions, setAssigneeOptions] = useState<{ value: string; text: string }[]>([]);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        priority: 'medium' as TicketInfo['priority'],
        status: 'open' as TicketInfo['status'],
        assignedTo: '',
        alertId: '',
    });

    // Comments state
    const [comments, setComments] = useState<TicketComment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Load ticket data, alerts list, and assignees
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [foundTicket, alertsData] = await Promise.all([
                    ticketDataService.getTicketById(ticketId || ''),
                    alertDataService.getAlerts(),
                ]);
                setTicket(foundTicket);
                setAlertsList(alertsData.map((a: any) => ({
                    id: a.id,
                    label: `${a.id} — ${a.aiTitle || a.title || 'Alert'}`,
                })));
                if (foundTicket) {
                    setEditForm({
                        title: foundTicket.title,
                        description: foundTicket.description,
                        priority: foundTicket.priority,
                        status: foundTicket.status,
                        assignedTo: foundTicket.assignedTo,
                        alertId: foundTicket.alertId || '',
                    });
                }

                // Load assignee options from users API
                try {
                    const usersResult = await userService.getUsers();
                    const users = usersResult.users || [];
                    setAssigneeOptions(users.map((u: any) => ({
                        value: u.username || `${u.first_name} ${u.last_name}`.trim(),
                        text: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.email,
                    })));
                } catch {
                    // Fallback if users API not available
                    setAssigneeOptions([
                        { value: 'John Smith', text: 'John Smith' },
                        { value: 'Jane Doe', text: 'Jane Doe' },
                        { value: 'Mike Johnson', text: 'Mike Johnson' },
                        { value: 'NOC Team', text: 'NOC Team' },
                        { value: 'Network Team', text: 'Network Team' },
                        { value: 'Security Team', text: 'Security Team' },
                    ]);
                }
            } catch (error) {
                console.error('Failed to load ticket:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [ticketId]);

    // Load comments separately
    useEffect(() => {
        if (!ticketId) return;
        const loadComments = async () => {
            setIsLoadingComments(true);
            try {
                const result = await ticketDataService.getComments(ticketId);
                setComments(result);
            } catch (error) {
                console.error('Failed to load comments:', error);
            } finally {
                setIsLoadingComments(false);
            }
        };
        loadComments();
    }, [ticketId]);

    const handleAddComment = async () => {
        if (!newComment.trim() || !ticketId) return;
        setIsSubmittingComment(true);
        try {
            const comment = await ticketDataService.addComment(ticketId, newComment.trim());
            setComments(prev => [...prev, comment]);
            setNewComment('');
            addToast('success', 'Comment Added', 'Your comment has been posted');
        } catch (error) {
            console.error('Failed to add comment:', error);
            addToast('error', 'Failed', 'Could not add comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleEditTicket = async () => {
        if (!ticket) return;
        try {
            const updatedTicket = await ticketDataService.updateTicket(ticket.id, {
                title: editForm.title,
                description: editForm.description,
                priority: editForm.priority,
                status: editForm.status,
                assignedTo: editForm.assignedTo,
                alertId: editForm.alertId,
            });
            setTicket(updatedTicket);
            setIsEditModalOpen(false);
            addToast('success', 'Ticket Updated', `${ticket.ticketNumber} has been updated successfully`);
        } catch (error) {
            console.error('Failed to update ticket:', error);
            addToast('error', 'Update Failed', 'Could not update ticket');
        }
    };

    const handleDeleteTicket = async () => {
        if (!ticket) return;
        try {
            await ticketDataService.deleteTicket(ticket.id);
            addToast('success', 'Ticket Deleted', `${ticket.ticketNumber} has been deleted`);
            setIsDeleteModalOpen(false);
            setTimeout(() => navigate('/tickets'), 1000);
        } catch (error) {
            console.error('Failed to delete ticket:', error);
            addToast('error', 'Delete Failed', 'Could not delete ticket');
        }
    };

    /** Format a date string to readable format */
    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    /** Format relative time */
    const timeAgo = (dateStr: string) => {
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
    };

    if (isLoading) {
        return (
            <div className="ticket-details-page ticket-details-page--loading">
                <SkeletonText className="ticket-details-page__skeleton" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="ticket-details-page">
                <InlineNotification
                    kind="error"
                    title="Error"
                    subtitle="Ticket not found"
                />
                <Button kind="ghost" onClick={() => navigate('/tickets')} renderIcon={ArrowLeft}>
                    Back to Tickets
                </Button>
            </div>
        );
    }

    // Calculate days open
    const createdDate = new Date(ticket.createdAt);
    const now = new Date();
    const daysOpen = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="ticket-details-page">
            {/* PageHeader Component */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Tickets', href: '/tickets' },
                    { label: ticket.ticketNumber, active: true }
                ]}
                title={ticket.ticketNumber}
                subtitle={ticket.title}
                badges={[
                    { text: ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1), variant: 'filled', color: ticket.priority === 'critical' ? '#da1e28' : ticket.priority === 'high' ? '#ff832b' : ticket.priority === 'medium' ? '#8a3ffc' : '#0f62fe' },
                    { text: ticket.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()), variant: 'outline', color: 'var(--cds-text-primary)' }
                ]}
                actions={[
                    { label: isLinkableAlertId(ticket.alertId) ? `View Alert (${ticket.alertId})` : 'No Linked Alert', icon: View, variant: 'primary' as const, onClick: () => isLinkableAlertId(ticket.alertId) && navigate(`/alerts/${ticket.alertId}`), disabled: !isLinkableAlertId(ticket.alertId) },
                    { label: 'Edit Ticket', icon: Edit, variant: 'secondary' as const, onClick: () => setIsEditModalOpen(true) },
                    { label: 'Delete', icon: TrashCan, variant: 'danger' as const, onClick: () => setIsDeleteModalOpen(true) },
                ]}
                showBorder
            />

            {/* KPI Row */}
            <div className="ticket-kpi-row" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <KPICard
                    id="status"
                    icon={Ticket}
                    iconColor={ticket.status === 'open' ? 'var(--cds-support-error)' : ticket.status === 'resolved' ? 'var(--cds-support-success)' : 'var(--cds-support-info)'}
                    label="Status"
                    value={ticket.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    subtitle={`Priority: ${ticket.priority}`}
                    severity={ticket.status === 'open' ? 'info' : ticket.status === 'resolved' ? 'success' : 'neutral'}
                />
                <KPICard
                    id="assignee"
                    icon={User}
                    iconColor="var(--cds-support-purple)"
                    label="Assigned To"
                    value={ticket.assignedTo || 'Unassigned'}
                    subtitle="Team Member"
                    severity="neutral"
                />
                <KPICard
                    id="created"
                    icon={Time}
                    iconColor="var(--cds-support-warning)"
                    label="Days Open"
                    value={daysOpen.toString()}
                    subtitle={`Created ${new Date(ticket.createdAt).toLocaleDateString()}`}
                    severity={daysOpen > 3 ? 'major' : 'neutral'}
                />
                <KPICard
                    id="comments"
                    icon={Chat}
                    iconColor="var(--cds-support-info)"
                    label="Comments"
                    value={comments.length.toString()}
                    subtitle="Activity entries"
                    severity="neutral"
                />
            </div>

            {/* Main Content */}
            <div className="ticket-details-page__content-grid">
                {/* Row 1: Ticket Details + Activity Timeline */}
                <div className="ticket-details-page__row">
                    <Tile className="ticket-card">
                        <div className="ticket-card__header">
                            <Ticket size={20} />
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
                                <span className="ticket-card__value">{ticket.assignedTo}</span>
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

                    <Tile className="ticket-card">
                        <div className="ticket-card__header">
                            <Activity size={20} />
                            <h3 className="ticket-card__title">Activity Timeline</h3>
                            <Tag size="sm" type="gray" style={{ marginLeft: 'auto' }}>
                                {comments.length} {comments.length === 1 ? 'entry' : 'entries'}
                            </Tag>
                        </div>

                        <div className="ticket-timeline">
                            {/* Real comments from API */}
                            {isLoadingComments ? (
                                <div style={{ padding: '1rem' }}>
                                    <SkeletonText paragraph lineCount={3} />
                                </div>
                            ) : comments.length > 0 ? (
                                comments.map((comment) => (
                                    <div key={comment.id} className="ticket-timeline__item">
                                        <div className="ticket-timeline__icon">
                                            <Chat size={16} />
                                        </div>
                                        <div className="ticket-timeline__content">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                    <Checkmark size={16} />
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
                        <div className="ticket-comment-form" style={{
                            borderTop: '1px solid var(--cds-border-subtle)',
                            padding: '1rem 0 0',
                            marginTop: '1rem',
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'flex-end',
                        }}>
                            <TextArea
                                id="new-comment"
                                labelText="Add a comment"
                                placeholder="Write a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={2}
                                style={{ flex: 1 }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                        handleAddComment();
                                    }
                                }}
                            />
                            <Button
                                kind="primary"
                                size="md"
                                renderIcon={Send}
                                disabled={!newComment.trim() || isSubmittingComment}
                                onClick={handleAddComment}
                                style={{ minWidth: '100px', height: '40px' }}
                            >
                                {isSubmittingComment ? 'Sending...' : 'Send'}
                            </Button>
                        </div>
                    </Tile>
                </div>
            </div>

            {/* Edit Ticket Modal */}
            <Modal
                open={isEditModalOpen}
                onRequestClose={() => setIsEditModalOpen(false)}
                modalHeading="Edit Ticket"
                primaryButtonText="Save Changes"
                secondaryButtonText="Cancel"
                onRequestSubmit={handleEditTicket}
                primaryButtonDisabled={!editForm.title}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <TextInput
                        id="edit-ticket-title"
                        labelText="Title"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        required
                        invalid={!editForm.title}
                        invalidText="Ticket title is required"
                    />

                    <TextArea
                        id="edit-ticket-description"
                        labelText="Description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={4}
                    />

                    <Select
                        id="edit-ticket-priority"
                        labelText="Priority"
                        value={editForm.priority}
                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as TicketInfo['priority'] })}
                    >
                        <SelectItem value="critical" text="Critical" />
                        <SelectItem value="high" text="High" />
                        <SelectItem value="medium" text="Medium" />
                        <SelectItem value="low" text="Low" />
                    </Select>

                    <Select
                        id="edit-ticket-status"
                        labelText="Status"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TicketInfo['status'] })}
                    >
                        <SelectItem value="open" text="Open" />
                        <SelectItem value="in-progress" text="In Progress" />
                        <SelectItem value="resolved" text="Resolved" />
                        <SelectItem value="closed" text="Closed" />
                    </Select>

                    <Select
                        id="edit-ticket-assignee"
                        labelText="Assigned To"
                        value={editForm.assignedTo}
                        onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                    >
                        <SelectItem value="" text="Select assignee..." />
                        {assigneeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} text={opt.text} />
                        ))}
                    </Select>

                    <ComboBox
                        id="edit-ticket-alert"
                        titleText="Linked Alert"
                        placeholder="Search or select an alert..."
                        items={alertsList}
                        itemToString={(item: { id: string; label: string } | null) => item?.label || ''}
                        selectedItem={alertsList.find(a => a.id === editForm.alertId) || null}
                        onChange={({ selectedItem }: { selectedItem: { id: string; label: string } | null | undefined }) => {
                            setEditForm({ ...editForm, alertId: selectedItem?.id || '' });
                        }}
                        helperText="Select the alert this ticket is related to"
                    />
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                open={isDeleteModalOpen}
                onRequestClose={() => setIsDeleteModalOpen(false)}
                modalHeading="Delete Ticket"
                primaryButtonText="Delete"
                secondaryButtonText="Cancel"
                onRequestSubmit={handleDeleteTicket}
                danger
            >
                <p>Are you sure you want to delete <strong>{ticket.ticketNumber}</strong>?</p>
                <p style={{ marginTop: '0.5rem', color: 'var(--cds-text-secondary)' }}>
                    This action cannot be undone. All comments and activity history will be lost.
                </p>
            </Modal>
        </div>
    );
}

export default TicketDetailsPage;
