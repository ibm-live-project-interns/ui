/**
 * Rule Form Modal
 *
 * Shared modal for creating and editing threshold rules.
 * Contains metric selector, condition builder, duration, and severity fields.
 */

import React from 'react';
import {
  Modal,
  TextInput,
  Select,
  SelectItem,
  NumberInput,
} from '@carbon/react';

import type { RuleEditForm } from '../types';
import { CONDITION_METRICS, CONDITION_OPERATORS } from '../types';
import type { RuleFormModalProps } from './thresholdRules.types';

export const RuleFormModal = React.memo(function RuleFormModal({
  open,
  mode,
  editForm,
  onFormChange,
  onClose,
  onSubmit,
}: RuleFormModalProps) {
  const prefix = mode === 'edit' ? 'edit' : 'new';
  const heading = mode === 'edit' ? 'Edit Rule' : 'Create New Rule';
  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Rule';

  // Percentage-based metrics should cap at 100
  const currentMetricDef = CONDITION_METRICS.find((m) => m.value === editForm.conditionMetric);
  const isPercentageMetric = currentMetricDef?.unit === '%';
  const maxConditionValue = isPercentageMetric ? 100 : 100000;

  const handleFieldChange = <K extends keyof RuleEditForm>(key: K, value: RuleEditForm[K]) => {
    onFormChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      onRequestSubmit={onSubmit}
      modalHeading={heading}
      modalLabel="Alert Configuration"
      primaryButtonText={submitLabel}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!editForm.name}
      size="md"
    >
      <div className="threshold-rules__form">
        <TextInput
          id={`${prefix}-rule-name`}
          labelText="Rule Name"
          value={editForm.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          placeholder={mode === 'new' ? 'e.g., High Memory Usage' : undefined}
          required
          invalid={!editForm.name}
          invalidText="Rule name is required"
        />
        <TextInput
          id={`${prefix}-rule-description`}
          labelText="Description"
          value={editForm.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder={mode === 'new' ? 'e.g., All Servers - Memory' : undefined}
        />

        <div>
          <label className="cds--label threshold-rules__form-label">Condition</label>
          <div className="threshold-rules__form-row">
            <Select
              id={`${prefix}-cond-metric`}
              labelText="Condition metric"
              hideLabel
              value={editForm.conditionMetric}
              onChange={(e) => {
                const newMetric = e.target.value;
                const newMetricDef = CONDITION_METRICS.find((m) => m.value === newMetric);
                const newIsPercentage = newMetricDef?.unit === '%';
                handleFieldChange('conditionMetric', newMetric);
                // Clamp value to 100 when switching to a percentage metric
                if (newIsPercentage && editForm.conditionValue > 100) {
                  handleFieldChange('conditionValue', 100);
                }
              }}
            >
              {CONDITION_METRICS.map((m) => (
                <SelectItem key={m.value} value={m.value} text={m.label} />
              ))}
            </Select>
            <Select
              id={`${prefix}-cond-op`}
              labelText="Condition operator"
              hideLabel
              value={editForm.conditionOperator}
              onChange={(e) => handleFieldChange('conditionOperator', e.target.value)}
            >
              {CONDITION_OPERATORS.map((op) => (
                <SelectItem key={op} value={op} text={op} />
              ))}
            </Select>
            <NumberInput
              id={`${prefix}-cond-value`}
              label="Threshold value"
              hideLabel
              min={0}
              max={maxConditionValue}
              value={editForm.conditionValue}
              onChange={(_e: React.SyntheticEvent, state: { value: string | number }) => {
                const raw = Number(state.value) || 0;
                handleFieldChange('conditionValue', Math.min(raw, maxConditionValue));
              }}
              invalidText={isPercentageMetric ? 'Value cannot exceed 100%' : undefined}
              size="md"
            />
            <span className="threshold-rules__form-unit">
              {CONDITION_METRICS.find((m) => m.value === editForm.conditionMetric)?.unit || ''}
            </span>
          </div>
        </div>

        <div>
          <label className="cds--label threshold-rules__form-label">Duration (trigger after)</label>
          <div className="threshold-rules__form-row">
            <NumberInput
              id={`${prefix}-dur-value`}
              label="Duration value"
              hideLabel
              min={1}
              max={1440}
              value={editForm.durationValue}
              onChange={(_e: React.SyntheticEvent, state: { value: string | number }) =>
                handleFieldChange('durationValue', Number(state.value) || 1)
              }
              size="md"
            />
            <Select
              id={`${prefix}-dur-unit`}
              labelText="Duration unit"
              hideLabel
              value={editForm.durationUnit}
              onChange={(e) => handleFieldChange('durationUnit', e.target.value)}
            >
              <SelectItem value="seconds" text="Seconds" />
              <SelectItem value="minutes" text="Minutes" />
              <SelectItem value="hours" text="Hours" />
            </Select>
          </div>
        </div>

        <Select
          id={`${prefix}-rule-severity`}
          labelText="Severity"
          value={editForm.severity}
          onChange={(e) => handleFieldChange('severity', e.target.value)}
        >
          <SelectItem value="critical" text="Critical" />
          <SelectItem value="major" text="Major" />
          <SelectItem value="warning" text="Warning" />
          <SelectItem value="info" text="Info" />
        </Select>
      </div>
    </Modal>
  );
});
