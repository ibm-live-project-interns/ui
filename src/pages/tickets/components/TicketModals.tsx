/**
 * Copyright IBM Corp. 2026
 *
 * TicketModals - All modal dialogs for the TicketsPage.
 * Contains Create, Resolve, and Reassign modals.
 */

import React from 'react';
import {
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  ComboBox,
} from '@carbon/react';

// ==========================================
// Types
// ==========================================

export interface CreateTicketFormData {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  alertId: string;
  deviceName: string;
  assignee: string;
}

export interface AssigneeOption {
  value: string;
  text: string;
}

interface AlertOption {
  id: string;
  label: string;
}

// ==========================================
// Create Ticket Modal
// ==========================================

export interface CreateTicketModalProps {
  isOpen: boolean;
  isCreating: boolean;
  formData: CreateTicketFormData;
  alertsList: AlertOption[];
  assigneeOptions: AssigneeOption[];
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (update: Partial<CreateTicketFormData>) => void;
}

export const CreateTicketModal = React.memo(function CreateTicketModal({
  isOpen,
  isCreating,
  formData,
  alertsList,
  assigneeOptions,
  onClose,
  onSubmit,
  onFormChange,
}: CreateTicketModalProps) {
  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      modalHeading="Create New Ticket"
      primaryButtonText={isCreating ? 'Creating...' : 'Create Ticket'}
      secondaryButtonText="Cancel"
      onRequestSubmit={onSubmit}
      primaryButtonDisabled={isCreating || !formData.title.trim()}
    >
      <div className="tickets-modal-form">
        <ComboBox
          id="create-ticket-alert"
          titleText="Linked Alert"
          placeholder="Search or select an alert..."
          items={alertsList}
          itemToString={(item: AlertOption | null) => item?.label || ''}
          selectedItem={alertsList.find((a) => a.id === formData.alertId) || null}
          onChange={({ selectedItem }: { selectedItem: AlertOption | null | undefined }) => {
            onFormChange({ alertId: selectedItem?.id || '' });
          }}
          helperText="Select the alert this ticket is related to"
        />
        <TextInput
          id="create-ticket-title"
          labelText="Title"
          placeholder="Enter ticket title"
          value={formData.title}
          onChange={(e) => onFormChange({ title: e.target.value })}
          required
          invalid={isCreating && !formData.title.trim()}
          invalidText="Ticket title is required"
        />
        <TextArea
          id="create-ticket-description"
          labelText="Description"
          placeholder="Describe the issue"
          value={formData.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          rows={4}
        />
        <Select
          id="create-ticket-priority"
          labelText="Priority"
          value={formData.priority}
          onChange={(e) => onFormChange({ priority: e.target.value as CreateTicketFormData['priority'] })}
        >
          <SelectItem value="critical" text="Critical" />
          <SelectItem value="high" text="High" />
          <SelectItem value="medium" text="Medium" />
          <SelectItem value="low" text="Low" />
        </Select>
        <TextInput
          id="create-ticket-device"
          labelText="Device Name (optional)"
          placeholder="Enter device name"
          value={formData.deviceName}
          onChange={(e) => onFormChange({ deviceName: e.target.value })}
        />
        <Select
          id="create-ticket-assignee"
          labelText="Assignee (optional)"
          value={formData.assignee}
          onChange={(e) => onFormChange({ assignee: e.target.value })}
        >
          <SelectItem value="" text="Select assignee..." />
          {assigneeOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} text={opt.text} />
          ))}
        </Select>
      </div>
    </Modal>
  );
});

// ==========================================
// Resolve Ticket Modal
// ==========================================

export interface ResolveTicketModalProps {
  isOpen: boolean;
  isResolving: boolean;
  ticketNumber: string;
  resolveNotes: string;
  onClose: () => void;
  onSubmit: () => void;
  onNotesChange: (notes: string) => void;
}

export const ResolveTicketModal = React.memo(function ResolveTicketModal({
  isOpen,
  isResolving,
  ticketNumber,
  resolveNotes,
  onClose,
  onSubmit,
  onNotesChange,
}: ResolveTicketModalProps) {
  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      modalHeading={`Resolve Ticket ${ticketNumber}`}
      primaryButtonText={isResolving ? 'Resolving...' : 'Resolve'}
      secondaryButtonText="Cancel"
      onRequestSubmit={onSubmit}
      primaryButtonDisabled={isResolving}
      danger={false}
    >
      <TextArea
        id="resolve-notes"
        labelText="Resolution Notes (optional)"
        placeholder="Describe how the issue was resolved..."
        value={resolveNotes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={4}
      />
    </Modal>
  );
});

// ==========================================
// Reassign Ticket Modal
// ==========================================

export interface ReassignTicketModalProps {
  isOpen: boolean;
  isReassigning: boolean;
  selectedCount: number;
  reassignTarget: string;
  assigneeOptions: AssigneeOption[];
  onClose: () => void;
  onSubmit: () => void;
  onTargetChange: (target: string) => void;
}

export const ReassignTicketModal = React.memo(function ReassignTicketModal({
  isOpen,
  isReassigning,
  selectedCount,
  reassignTarget,
  assigneeOptions,
  onClose,
  onSubmit,
  onTargetChange,
}: ReassignTicketModalProps) {
  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      modalHeading={`Reassign ${selectedCount} Ticket${selectedCount !== 1 ? 's' : ''}`}
      primaryButtonText={isReassigning ? 'Reassigning...' : 'Reassign'}
      secondaryButtonText="Cancel"
      onRequestSubmit={onSubmit}
      primaryButtonDisabled={isReassigning || !reassignTarget}
    >
      <Select
        id="reassign-target"
        labelText="New Assignee"
        value={reassignTarget}
        onChange={(e) => onTargetChange(e.target.value)}
      >
        <SelectItem value="" text="Select assignee..." />
        {assigneeOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} text={opt.text} />
        ))}
      </Select>
    </Modal>
  );
});
