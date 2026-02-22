/**
 * Copyright IBM Corp. 2026
 *
 * OnCallModals - Schedule form, Override form, and Delete confirmation modals.
 * All three modals used by OnCallPage, extracted for file-size reduction.
 */

import React from 'react';
import {
  Modal,
  TextInput,
  DatePicker,
  DatePickerInput,
  Select,
  SelectItem,
  Toggle,
  TextArea,
} from '@carbon/react';

import type { OnCallSchedule } from '@/shared/services';
import type { UseFormModalResult } from '@/shared/hooks';
import type { ScheduleFormValues, OverrideFormValues } from './types';
import { formatShortDate } from './types';

// ==========================================
// Schedule Form Modal
// ==========================================

interface ScheduleFormModalProps {
  modal: UseFormModalResult<ScheduleFormValues>;
  onSubmit: () => void;
}

export const ScheduleFormModal = React.memo(function ScheduleFormModal({
  modal,
  onSubmit,
}: ScheduleFormModalProps) {
  return (
    <Modal
      open={modal.isOpen}
      onRequestClose={modal.close}
      onRequestSubmit={onSubmit}
      modalHeading={modal.values.id > 0 ? 'Edit Schedule' : 'Create Schedule'}
      primaryButtonText={modal.isSubmitting ? 'Saving...' : 'Save'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={modal.isSubmitting}
      size="md"
    >
      <div className="oncall-page__form-group">
        <TextInput
          id="schedule-username"
          labelText="On-Call Person"
          placeholder="Enter name (e.g., John Smith)"
          value={modal.values.username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            modal.setField('username', e.target.value)
          }
          required
        />
        <div className="oncall-page__form-row">
          <DatePicker
            datePickerType="single"
            onChange={(_dates: Date[], currentDateString: string) =>
              modal.setField('startDate', currentDateString)
            }
          >
            <DatePickerInput
              id="schedule-start-date"
              labelText="Start Date"
              placeholder="mm/dd/yyyy"
            />
          </DatePicker>
          <TextInput
            id="schedule-start-time"
            labelText="Start Time"
            placeholder="HH:MM"
            value={modal.values.startTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              modal.setField('startTime', e.target.value)
            }
          />
        </div>
        <div className="oncall-page__form-row">
          <DatePicker
            datePickerType="single"
            onChange={(_dates: Date[], currentDateString: string) =>
              modal.setField('endDate', currentDateString)
            }
          >
            <DatePickerInput
              id="schedule-end-date"
              labelText="End Date"
              placeholder="mm/dd/yyyy"
            />
          </DatePicker>
          <TextInput
            id="schedule-end-time"
            labelText="End Time"
            placeholder="HH:MM"
            value={modal.values.endTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              modal.setField('endTime', e.target.value)
            }
          />
        </div>
        <div className="oncall-page__form-row">
          <Select
            id="schedule-rotation"
            labelText="Rotation Type"
            value={modal.values.rotation_type}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              modal.setField('rotation_type', e.target.value)
            }
          >
            <SelectItem value="daily" text="Daily" />
            <SelectItem value="weekly" text="Weekly" />
            <SelectItem value="biweekly" text="Bi-weekly" />
            <SelectItem value="monthly" text="Monthly" />
          </Select>
          <div className="u-toggle-row">
            <Toggle
              id="schedule-primary"
              labelText="Role"
              labelA="Secondary"
              labelB="Primary"
              toggled={modal.values.is_primary}
              onToggle={(checked: boolean) => modal.setField('is_primary', checked)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
});

// ==========================================
// Override Form Modal
// ==========================================

interface OverrideFormModalProps {
  modal: UseFormModalResult<OverrideFormValues>;
  activeSchedules: OnCallSchedule[];
  onSubmit: () => void;
}

export const OverrideFormModal = React.memo(function OverrideFormModal({
  modal,
  activeSchedules,
  onSubmit,
}: OverrideFormModalProps) {
  return (
    <Modal
      open={modal.isOpen}
      onRequestClose={modal.close}
      onRequestSubmit={onSubmit}
      modalHeading="Create Override"
      primaryButtonText={modal.isSubmitting ? 'Creating...' : 'Create'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={modal.isSubmitting}
      size="md"
    >
      <div className="oncall-page__form-group">
        <Select
          id="override-schedule"
          labelText="Schedule to Override"
          value={modal.values.schedule_id}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            modal.setField('schedule_id', e.target.value)
          }
        >
          <SelectItem value="" text="Select a schedule..." />
          {activeSchedules.map((s) => (
            <SelectItem
              key={s.id}
              value={String(s.id)}
              text={`${s.username} (${s.rotation_type}, ${formatShortDate(s.start_time)} - ${formatShortDate(s.end_time)})`}
            />
          ))}
        </Select>
        <div className="oncall-page__form-row">
          <DatePicker
            datePickerType="single"
            onChange={(_dates: Date[], currentDateString: string) =>
              modal.setField('startDate', currentDateString)
            }
          >
            <DatePickerInput
              id="override-start-date"
              labelText="Override Start Date"
              placeholder="mm/dd/yyyy"
            />
          </DatePicker>
          <TextInput
            id="override-start-time"
            labelText="Start Time"
            placeholder="HH:MM"
            value={modal.values.startTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              modal.setField('startTime', e.target.value)
            }
          />
        </div>
        <div className="oncall-page__form-row">
          <DatePicker
            datePickerType="single"
            onChange={(_dates: Date[], currentDateString: string) =>
              modal.setField('endDate', currentDateString)
            }
          >
            <DatePickerInput
              id="override-end-date"
              labelText="Override End Date"
              placeholder="mm/dd/yyyy"
            />
          </DatePicker>
          <TextInput
            id="override-end-time"
            labelText="End Time"
            placeholder="HH:MM"
            value={modal.values.endTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              modal.setField('endTime', e.target.value)
            }
          />
        </div>
        <TextArea
          id="override-reason"
          labelText="Reason"
          placeholder="Why is this override needed? (optional)"
          value={modal.values.reason}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            modal.setField('reason', e.target.value)
          }
          rows={3}
        />
      </div>
    </Modal>
  );
});

// ==========================================
// Delete Confirmation Modal
// ==========================================

interface DeleteConfirmModalProps {
  deleteTarget: { type: 'schedule' | 'override'; id: number } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal = React.memo(function DeleteConfirmModal({
  deleteTarget,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      open={deleteTarget !== null}
      onRequestClose={onClose}
      onRequestSubmit={onConfirm}
      modalHeading={`Delete ${deleteTarget?.type === 'schedule' ? 'Schedule' : 'Override'}`}
      primaryButtonText="Delete"
      secondaryButtonText="Cancel"
      danger
      size="sm"
    >
      <p>
        Are you sure you want to delete this {deleteTarget?.type}?
        {deleteTarget?.type === 'schedule' && ' All associated overrides will also be removed.'}
        {' '}This action cannot be undone.
      </p>
    </Modal>
  );
});
