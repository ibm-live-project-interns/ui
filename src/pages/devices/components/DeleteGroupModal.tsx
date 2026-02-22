/**
 * Copyright IBM Corp. 2026
 *
 * DeleteGroupModal - Confirmation modal for deleting a device group.
 */

import React from 'react';
import { Modal } from '@carbon/react';

import type { DeviceGroup } from '@/shared/services/deviceGroupService';

// ==========================================
// Props
// ==========================================

export interface DeleteGroupModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** The group being deleted (null when modal closed) */
    group: DeviceGroup | null;
    /** Whether a delete operation is in progress */
    isDeleting: boolean;
    /** Callback when the modal is closed */
    onClose: () => void;
    /** Callback when the delete is confirmed */
    onConfirm: () => void;
}

// ==========================================
// Component
// ==========================================

export const DeleteGroupModal = React.memo(function DeleteGroupModal({
    open,
    group,
    isDeleting,
    onClose,
    onConfirm,
}: DeleteGroupModalProps) {
    return (
        <Modal
            open={open}
            onRequestClose={onClose}
            onRequestSubmit={onConfirm}
            danger
            modalHeading="Delete Device Group"
            primaryButtonText={isDeleting ? 'Deleting...' : 'Delete'}
            primaryButtonDisabled={isDeleting}
            secondaryButtonText="Cancel"
            size="sm"
        >
            <p className="device-groups-page__delete-info">
                Are you sure you want to delete the group{' '}
                <strong>{group?.name}</strong>? This will not delete the devices
                themselves, only the group assignment. This action cannot be undone.
            </p>
        </Modal>
    );
});
