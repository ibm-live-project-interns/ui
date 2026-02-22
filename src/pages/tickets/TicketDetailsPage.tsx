import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { logger } from '@/shared/utils/logger';
import {
    Button,
    InlineNotification,
    Modal,
    TextInput,
    TextArea,
    Select,
    SelectItem,
    ComboBox,
} from '@carbon/react';
import {
    Edit, View, Time, Ticket, User, Activity, ArrowLeft,
    Chat, TrashCan,
} from '@carbon/icons-react';
import '@/styles/pages/_ticket-details.scss';

// Services
import { ticketDataService, alertDataService, type TicketInfo } from '@/shared/services';
import type { TicketComment } from '@/features/tickets/services/ticketService';
import { userService } from '@/shared/services';
import type { ManagedUser } from '@/features/auth/services/userService';
import type { PriorityAlert } from '@/features/alerts/types';
import { KPICard } from '@/components';
import { PageHeader } from '@/components/ui';
import { PageLayout } from '@/components/layout';
import { useToast } from '@/contexts';

import {
    TicketDetailsSkeleton,
    TicketInfoPanel,
    TicketActivitySection,
    isLinkableAlertId,
} from './components';
import type { EditFormData, AlertOption, AssigneeSelectOption } from './components';

export function TicketDetailsPage() {
    const { ticketId } = useParams<{ ticketId: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [ticket, setTicket] = useState<TicketInfo | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [alertsList, setAlertsList] = useState<AlertOption[]>([]);
    const [assigneeOptions, setAssigneeOptions] = useState<AssigneeSelectOption[]>([]);
    const [editForm, setEditForm] = useState<EditFormData>({
        title: '',
        description: '',
        priority: 'medium',
        status: 'open',
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
                setAlertsList(alertsData.map((a: PriorityAlert) => ({
                    id: a.id,
                    label: `${a.id} — ${a.aiTitle || 'Alert'}`,
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
                    const users: ManagedUser[] = await userService.getUsers();
                    setAssigneeOptions(users.map((u: ManagedUser) => ({
                        value: u.username || `${u.first_name} ${u.last_name}`.trim(),
                        text: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.email,
                    })));
                } catch (err) {
                    logger.warn('Users API unavailable, using fallback assignees', err);
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
                logger.error('Failed to load ticket', error);
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
                logger.error('Failed to load comments', error);
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
            logger.error('Failed to add comment', error);
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
            logger.error('Failed to update ticket', error);
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
            logger.error('Failed to delete ticket', error);
            addToast('error', 'Delete Failed', 'Could not delete ticket');
        }
    };

    if (isLoading) {
        return <TicketDetailsSkeleton />;
    }

    if (!ticket) {
        return (
            <PageLayout>
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
            </PageLayout>
        );
    }

    // Calculate days open
    const createdDate = new Date(ticket.createdAt);
    const now = new Date();
    const daysOpen = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <PageLayout>
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
                    { text: ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1), variant: 'filled', color: ticket.priority === 'critical' ? 'var(--cds-support-error, #da1e28)' : ticket.priority === 'high' ? 'var(--cds-support-warning, #ff832b)' : ticket.priority === 'medium' ? 'var(--cds-support-info, #8a3ffc)' : 'var(--cds-interactive, #0f62fe)' },
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
            <div className="ticket-kpi-row">
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
                    <TicketInfoPanel ticket={ticket} />

                    <TicketActivitySection
                        ticket={ticket}
                        comments={comments}
                        isLoadingComments={isLoadingComments}
                        newComment={newComment}
                        isSubmittingComment={isSubmittingComment}
                        onNewCommentChange={setNewComment}
                        onAddComment={handleAddComment}
                    />
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
                <div className="ticket-edit-modal__form">
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
                <p className="ticket-delete-modal__warning">
                    This action cannot be undone. All comments and activity history will be lost.
                </p>
            </Modal>
        </div>
        </PageLayout>
    );
}

export default TicketDetailsPage;
