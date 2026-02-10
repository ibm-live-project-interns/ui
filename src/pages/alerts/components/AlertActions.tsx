/**
 * Alert Actions Component
 *
 * Action buttons for alert management:
 * - Acknowledge: Mark alert as acknowledged
 * - Create Ticket: Open ticket creation flow
 * - Dismiss: Dismiss the alert
 *
 * All actions are functional and call the provided handlers.
 */

import { useState } from 'react';
import { Button, Loading, Modal, TextArea, TextInput, Select, SelectItem } from '@carbon/react';
import { Checkmark, Add, Close } from '@carbon/icons-react';
import type { AlertStatus } from '@/shared/types/common.types';
import '@/styles/pages/_alert-details.scss';

interface AlertActionsProps {
    alertId: string;
    currentStatus: AlertStatus;
    onAcknowledge: (alertId: string) => Promise<void>;
    onCreateTicket: (alertId: string, ticketData: TicketData) => Promise<void>;
    onDismiss: (alertId: string) => Promise<void>;
}

interface TicketData {
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    assignee?: string;
}

export function AlertActions({
    alertId,
    currentStatus,
    onAcknowledge,
    onCreateTicket,
    onDismiss,
}: AlertActionsProps) {
    const [isAcknowledging, setIsAcknowledging] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const [ticketForm, setTicketForm] = useState<TicketData>({
        title: '',
        description: '',
        priority: 'high',
    });

    const handleAcknowledge = async () => {
        setIsAcknowledging(true);
        try {
            await onAcknowledge(alertId);
        } finally {
            setIsAcknowledging(false);
        }
    };

    const handleDismiss = async () => {
        setIsDismissing(true);
        try {
            await onDismiss(alertId);
        } finally {
            setIsDismissing(false);
        }
    };

    const handleCreateTicket = async () => {
        setIsCreatingTicket(true);
        try {
            await onCreateTicket(alertId, ticketForm);
            setIsTicketModalOpen(false);
            setTicketForm({ title: '', description: '', priority: 'high' });
        } finally {
            setIsCreatingTicket(false);
        }
    };

    const isAlreadyAcknowledged = currentStatus === 'acknowledged' || currentStatus === 'resolved';
    const isAlreadyDismissed = currentStatus === 'dismissed' || currentStatus === 'resolved';

    return (
        <>
            <div className="alert-actions">
                <Button
                    kind="primary"
                    size="md"
                    renderIcon={isAcknowledging ? undefined : Checkmark}
                    onClick={handleAcknowledge}
                    disabled={isAlreadyAcknowledged || isAcknowledging}
                >
                    {isAcknowledging ? (
                        <>
                            <Loading small withOverlay={false} />
                            Acknowledging...
                        </>
                    ) : isAlreadyAcknowledged ? (
                        'Acknowledged'
                    ) : (
                        'Acknowledge'
                    )}
                </Button>

                <Button
                    kind="secondary"
                    size="md"
                    renderIcon={Add}
                    onClick={() => setIsTicketModalOpen(true)}
                >
                    Create Ticket
                </Button>

                <Button
                    kind="danger"
                    size="md"
                    renderIcon={isDismissing ? undefined : Close}
                    onClick={handleDismiss}
                    disabled={isAlreadyDismissed || isDismissing}
                >
                    {isDismissing ? (
                        <>
                            <Loading small withOverlay={false} />
                            Dismissing...
                        </>
                    ) : isAlreadyDismissed ? (
                        'Dismissed'
                    ) : (
                        'Dismiss'
                    )}
                </Button>
            </div>

            {/* Create Ticket Modal */}
            <Modal
                open={isTicketModalOpen}
                onRequestClose={() => setIsTicketModalOpen(false)}
                modalHeading="Create Support Ticket"
                primaryButtonText={isCreatingTicket ? 'Creating...' : 'Create Ticket'}
                secondaryButtonText="Cancel"
                onRequestSubmit={handleCreateTicket}
                primaryButtonDisabled={isCreatingTicket || !ticketForm.title}
            >
                <div className="alert-actions__ticket-form">
                    <TextInput
                        id="ticket-title"
                        labelText="Ticket Title"
                        placeholder="Enter ticket title"
                        value={ticketForm.title}
                        onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                        required
                        invalid={!ticketForm.title}
                        invalidText="Ticket title is required"
                    />

                    <TextArea
                        id="ticket-description"
                        labelText="Description"
                        placeholder="Describe the issue and required actions"
                        value={ticketForm.description}
                        onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                        rows={4}
                    />

                    <Select
                        id="ticket-priority"
                        labelText="Priority"
                        value={ticketForm.priority}
                        onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as TicketData['priority'] })}
                    >
                        <SelectItem value="critical" text="Critical" />
                        <SelectItem value="high" text="High" />
                        <SelectItem value="medium" text="Medium" />
                        <SelectItem value="low" text="Low" />
                    </Select>

                    <Select
                        id="ticket-assignee"
                        labelText="Assignee (optional)"
                        value={ticketForm.assignee || ''}
                        onChange={(e) => setTicketForm({ ...ticketForm, assignee: e.target.value })}
                    >
                        <SelectItem value="" text="Select assignee..." />
                        <SelectItem value="John Smith" text="John Smith" />
                        <SelectItem value="Jane Doe" text="Jane Doe" />
                        <SelectItem value="Mike Johnson" text="Mike Johnson" />
                        <SelectItem value="Sarah Williams" text="Sarah Williams" />
                        <SelectItem value="DBA Team" text="DBA Team" />
                        <SelectItem value="Network Team" text="Network Team" />
                        <SelectItem value="Security Team" text="Security Team" />
                        <SelectItem value="NOC Team" text="NOC Team" />
                    </Select>
                </div>
            </Modal>
        </>
    );
}

export default AlertActions;
