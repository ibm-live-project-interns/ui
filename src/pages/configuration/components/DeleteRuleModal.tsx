/**
 * Delete Rule Confirmation Modal
 *
 * Simple danger modal for confirming rule deletion.
 */

import React from 'react';
import { Modal } from '@carbon/react';

import type { DeleteRuleModalProps } from './thresholdRules.types';

export const DeleteRuleModal = React.memo(function DeleteRuleModal({
  open,
  rule,
  onClose,
  onConfirm,
}: DeleteRuleModalProps) {
  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      onRequestSubmit={onConfirm}
      modalHeading="Delete Rule"
      modalLabel="Confirm Deletion"
      primaryButtonText="Delete"
      secondaryButtonText="Cancel"
      danger
      size="sm"
    >
      <p className="threshold-rules__delete-text">
        Are you sure you want to delete the rule <strong>&quot;{rule?.name}&quot;</strong>? This action cannot be undone.
      </p>
    </Modal>
  );
});
