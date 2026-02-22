/**
 * Copyright IBM Corp. 2026
 *
 * RunbookModals - Create/Edit, View Detail, and Delete confirmation modals
 * for the Runbooks page.
 */

import React from 'react';
import {
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  Button,
  Tag,
  IconButton,
} from '@carbon/react';
import {
  Add,
  Edit,
  TrashCan,
  Close,
} from '@carbon/icons-react';

import type { Runbook } from './RunbookCard';

// ==========================================
// Types
// ==========================================

export interface RunbookFormData {
  title: string;
  category: string;
  description: string;
  steps: string[];
  related_alert_types: string[];
}

// ==========================================
// Constants
// ==========================================

const CATEGORY_TAG_TYPES: Record<string, 'red' | 'blue' | 'purple' | 'teal' | 'warm-gray'> = {
  Hardware: 'red',
  Network: 'blue',
  Software: 'purple',
  Security: 'teal',
};

// ==========================================
// Helpers
// ==========================================

function formatDate(isoString: string): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

// ==========================================
// Create/Edit Modal
// ==========================================

export interface CreateEditRunbookModalProps {
  isOpen: boolean;
  isSaving: boolean;
  editingRunbook: Runbook | null;
  formData: RunbookFormData;
  stepIds: string[];
  formErrors: Record<string, string>;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (update: Partial<RunbookFormData>) => void;
  onStepChange: (index: number, value: string) => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
}

export const CreateEditRunbookModal = React.memo(function CreateEditRunbookModal({
  isOpen,
  isSaving,
  editingRunbook,
  formData,
  stepIds,
  formErrors,
  onClose,
  onSubmit,
  onFormChange,
  onStepChange,
  onAddStep,
  onRemoveStep,
}: CreateEditRunbookModalProps) {
  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      onRequestSubmit={onSubmit}
      modalHeading={editingRunbook ? 'Edit Runbook' : 'Create New Runbook'}
      primaryButtonText={isSaving ? 'Saving...' : editingRunbook ? 'Update Runbook' : 'Create Runbook'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={isSaving}
      size="lg"
      hasScrollingContent
    >
      <div className="runbooks-page__form">
        <TextInput
          id="runbook-title"
          labelText="Title"
          placeholder="e.g., High CPU Utilization: Diagnosis and Mitigation"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onFormChange({ title: e.target.value })
          }
          invalid={!!formErrors.title}
          invalidText={formErrors.title}
        />

        <Select
          id="runbook-category"
          labelText="Category"
          value={formData.category}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onFormChange({ category: e.target.value })
          }
          invalid={!!formErrors.category}
          invalidText={formErrors.category}
        >
          <SelectItem value="" text="Select a category..." />
          <SelectItem value="Hardware" text="Hardware" />
          <SelectItem value="Network" text="Network" />
          <SelectItem value="Software" text="Software" />
          <SelectItem value="Security" text="Security" />
        </Select>

        <TextArea
          id="runbook-description"
          labelText="Description"
          placeholder="Describe the purpose and scope of this runbook..."
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onFormChange({ description: e.target.value })
          }
          invalid={!!formErrors.description}
          invalidText={formErrors.description}
          rows={3}
        />

        <div className="runbooks-page__form-steps">
          <div className="runbooks-page__form-steps-header">
            <span className="runbooks-page__form-steps-label">
              Steps
              {formErrors.steps && (
                <span className="runbooks-page__form-steps-error">
                  {' '} - {formErrors.steps}
                </span>
              )}
            </span>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Add}
              onClick={onAddStep}
            >
              Add Step
            </Button>
          </div>

          {formData.steps.map((step, index) => (
            <div key={stepIds[index] || `fallback-${index}`} className="runbooks-page__form-step-row">
              <span className="runbooks-page__form-step-number">
                {index + 1}.
              </span>
              <TextInput
                id={`runbook-step-${index}`}
                labelText=""
                hideLabel
                placeholder={`Step ${index + 1} instruction...`}
                value={step}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onStepChange(index, e.target.value)
                }
              />
              {formData.steps.length > 1 && (
                <IconButton
                  kind="ghost"
                  size="sm"
                  label="Remove step"
                  onClick={() => onRemoveStep(index)}
                >
                  <Close size={16} />
                </IconButton>
              )}
            </div>
          ))}
        </div>

        <TextInput
          id="runbook-alert-types"
          labelText="Related Alert Types (comma-separated)"
          placeholder="e.g., high_cpu, cpu_threshold, process_runaway"
          value={formData.related_alert_types.join(', ')}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onFormChange({
              related_alert_types: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s !== ''),
            })
          }
        />
      </div>
    </Modal>
  );
});

// ==========================================
// View Detail Modal
// ==========================================

export interface ViewRunbookModalProps {
  isOpen: boolean;
  runbook: Runbook | null;
  onClose: () => void;
  onEdit: (runbook: Runbook) => void;
  onDelete: (runbook: Runbook) => void;
}

export const ViewRunbookModal = React.memo(function ViewRunbookModal({
  isOpen,
  runbook,
  onClose,
  onEdit,
  onDelete,
}: ViewRunbookModalProps) {
  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      passiveModal
      modalHeading={runbook?.title || 'Runbook Detail'}
      size="lg"
      hasScrollingContent
    >
      {runbook && (
        <div className="runbooks-page__detail">
          <div className="runbooks-page__detail-header">
            <Tag
              type={CATEGORY_TAG_TYPES[runbook.category] || 'warm-gray'}
              size="md"
            >
              {runbook.category}
            </Tag>
            <div className="runbooks-page__detail-meta">
              <span>By {runbook.author}</span>
              <span>Updated {formatDate(runbook.last_updated)}</span>
              <span>{runbook.usage_count} views</span>
            </div>
          </div>

          <p className="runbooks-page__detail-description">
            {runbook.description}
          </p>

          <h4 className="runbooks-page__detail-section-title">
            Procedure ({runbook.steps.length} steps)
          </h4>
          <ol className="runbooks-page__detail-steps">
            {runbook.steps.map((step) => (
              <li key={step.order} className="runbooks-page__detail-step">
                <span className="runbooks-page__detail-step-number">
                  {step.order}
                </span>
                <span className="runbooks-page__detail-step-text">
                  {step.instruction}
                </span>
              </li>
            ))}
          </ol>

          {runbook.related_alert_types &&
            runbook.related_alert_types.length > 0 && (
              <>
                <h4 className="runbooks-page__detail-section-title">
                  Related Alert Types
                </h4>
                <div className="runbooks-page__detail-tags">
                  {runbook.related_alert_types.map((alertType) => (
                    <Tag key={alertType} type="cool-gray" size="sm">
                      {alertType}
                    </Tag>
                  ))}
                </div>
              </>
            )}

          <div className="runbooks-page__detail-actions">
            <Button
              kind="secondary"
              size="md"
              renderIcon={Edit}
              onClick={() => {
                onClose();
                onEdit(runbook);
              }}
            >
              Edit Runbook
            </Button>
            <Button
              kind="danger--ghost"
              size="md"
              renderIcon={TrashCan}
              onClick={() => {
                onClose();
                onDelete(runbook);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
});

// ==========================================
// Delete Confirmation Modal
// ==========================================

export interface DeleteRunbookModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  runbook: Runbook | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteRunbookModal = React.memo(function DeleteRunbookModal({
  isOpen,
  isDeleting,
  runbook,
  onClose,
  onConfirm,
}: DeleteRunbookModalProps) {
  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      onRequestSubmit={onConfirm}
      danger
      modalHeading="Delete Runbook"
      primaryButtonText={isDeleting ? 'Deleting...' : 'Delete'}
      primaryButtonDisabled={isDeleting}
      secondaryButtonText="Cancel"
      size="sm"
    >
      <p>
        Are you sure you want to delete the runbook{' '}
        <strong>{runbook?.title}</strong>? This action cannot be undone.
      </p>
    </Modal>
  );
});
