/**
 * Threshold Rules Tab - Types & Interfaces
 *
 * Types specific to the ThresholdRulesTab component and its children.
 * Shared configuration types (Rule, Channel, GlobalSettings, etc.) remain in ../types.ts.
 */

import type { Rule, RuleEditForm } from '../types';

// ==========================================
// Component prop interfaces
// ==========================================

export interface ThresholdRulesTabProps {
  onNavigateToChannels: () => void;
}

export interface RuleFormModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** 'edit' or 'new' mode determines heading text and submit button label */
  mode: 'edit' | 'new';
  /** Current form state */
  editForm: RuleEditForm;
  /** Callback to update form fields */
  onFormChange: (updater: (prev: RuleEditForm) => RuleEditForm) => void;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when form is submitted */
  onSubmit: () => void;
}

export interface DeleteRuleModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** The rule being deleted (null if none selected) */
  rule: Rule | null;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when delete is confirmed */
  onConfirm: () => void;
}

export interface SettingsSidePanelProps {
  /** Current global settings */
  maintenanceMode: boolean;
  autoResolve: boolean;
  aiCorrelation: boolean;
  /** Callback when a global setting toggle is changed */
  onToggleSetting: (key: 'maintenanceMode' | 'autoResolve' | 'aiCorrelation') => void;
  /** Active notification channels to display */
  channels: Array<{
    id: string;
    name: string;
    type: string;
    meta: string;
    active: boolean;
  }>;
  /** Callback to navigate to the channels tab */
  onNavigateToChannels: () => void;
}
