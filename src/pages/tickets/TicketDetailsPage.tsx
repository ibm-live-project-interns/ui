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
    ToastNotification,
} from '@carbon/react';
import { Edit, View, Time, Ticket, User, Activity, ArrowLeft, Checkmark } from '@carbon/icons-react';
import '@/styles/pages/_ticket-details.scss';

// Services
import { ticketDataService, type TicketInfo } from '@/shared/services';
import { KPICard } from '@/components';
import { PageHeader } from '@/components/ui';

// Toast message type
interface ToastMessage {
    id: string;
    kind: 'success' | 'error' | 'info' | 'warning';
    title: string;
    subtitle: string;
}

export function TicketDetailsPage() {
    const { ticketId } = useParams<{ ticketId: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [ticket, setTicket] = useState<TicketInfo | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        priority: 'medium' as TicketInfo['priority'],
        status: 'open' as TicketInfo['status'],
        assignedTo: '',
    });
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (kind: ToastMessage['kind'], title: string, subtitle: string) => {
        const id = `toast-${Date.now()}`;
        setToasts(prev => [...prev, { id, kind, title, subtitle }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    useEffect(() => {
        const loadTicket = async () => {
            setIsLoading(true);
            try {
                const foundTicket = await ticketDataService.getTicketById(ticketId || '');
                setTicket(foundTicket);
                if (foundTicket) {
                    setEditForm({
                        title: foundTicket.title,
                        description: foundTicket.description,
                        priority: foundTicket.priority,
                        status: foundTicket.status,
                        assignedTo: foundTicket.assignedTo,
                    });
                }
            } catch (error) {
                console.error('Failed to load ticket:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTicket();
    }, [ticketId]);

    const handleEditTicket = async () => {
        if (!ticket) return;
        try {
            const updatedTicket = await ticketDataService.updateTicket(ticket.id, {
                title: editForm.title,
                description: editForm.description,
                priority: editForm.priority,
                status: editForm.status,
                assignedTo: editForm.assignedTo,
            });
            setTicket(updatedTicket);
            setIsEditModalOpen(false);
            addToast('success', 'Ticket Updated', `${ticket.ticketNumber} has been updated successfully`);
        } catch (error) {
            console.error('Failed to update ticket:', error);
            addToast('error', 'Update Failed', 'Could not update ticket');
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
            {/* Toast Notifications Container */}
            <div className="ticket-details-page__toast-container">
                {toasts.map((toast) => (
                    <ToastNotification
                        key={toast.id}
                        kind={toast.kind}
                        title={toast.title}
                        subtitle={toast.subtitle}
                        timeout={5000}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>

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
                    { label: 'View Alert', icon: View, variant: 'primary', onClick: () => navigate(`/alerts/${ticket.alertId}`) },
                    { label: 'Edit Ticket', icon: Edit, variant: 'secondary', onClick: () => setIsEditModalOpen(true) }
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
                    id="device"
                    icon={Activity}
                    iconColor="var(--cds-support-success)"
                    label="Device"
                    value={ticket.deviceName}
                    subtitle="Related device"
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
                                <span className="ticket-card__value">{ticket.createdAt}</span>
                            </div>
                            <div className="ticket-card__row">
                                <span className="ticket-card__label">Last Updated</span>
                                <span className="ticket-card__value">{ticket.updatedAt}</span>
                            </div>
                            <div className="ticket-card__row">
                                <span className="ticket-card__label">Related Alert</span>
                                <Link to={`/alerts/${ticket.alertId}`} className="ticket-card__value ticket-card__value--link">
                                    {ticket.alertId}
                                </Link>
                            </div>
                        </div>
                    </Tile>

                    <Tile className="ticket-card">
                        <div className="ticket-card__header">
                            <Activity size={20} />
                            <h3 className="ticket-card__title">Activity Timeline</h3>
                        </div>

                        <div className="ticket-timeline">
                            <div className="ticket-timeline__item">
                                <div className="ticket-timeline__icon ticket-timeline__icon--current">
                                    <Checkmark size={16} />
                                </div>
                                <div className="ticket-timeline__content">
                                    <p className="ticket-timeline__title">Status Updated</p>
                                    <p className="ticket-timeline__description">
                                        Status changed to <strong>{ticket.status}</strong>
                                    </p>
                                    <p className="ticket-timeline__timestamp">{ticket.updatedAt}</p>
                                </div>
                            </div>

                            <div className="ticket-timeline__item">
                                <div className="ticket-timeline__icon">
                                    <Edit size={16} />
                                </div>
                                <div className="ticket-timeline__content">
                                    <p className="ticket-timeline__title">Ticket Created</p>
                                    <p className="ticket-timeline__description">
                                        Created from alert {ticket.alertId}
                                    </p>
                                    <p className="ticket-timeline__timestamp">{ticket.createdAt}</p>
                                </div>
                            </div>
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

                    <TextInput
                        id="edit-ticket-assignee"
                        labelText="Assigned To"
                        value={editForm.assignedTo}
                        onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                    />
                </div>
            </Modal>
        </div>
    );
}

export default TicketDetailsPage;
