/**
 * Copyright IBM Corp. 2026
 *
 * GroupFormModal - Create / Edit device group modal.
 * Contains form fields for name, description, color picker, and device multi-select.
 */

import React from 'react';
import {
    Modal,
    TextInput,
    TextArea,
    Dropdown,
    FilterableMultiSelect,
} from '@carbon/react';

import type { DeviceGroup, CreateDeviceGroupRequest } from '@/shared/services/deviceGroupService';
import type { FilterOption, DeviceOption } from './deviceGroups.types';
import { COLOR_OPTIONS } from './deviceGroups.types';

// ==========================================
// Props
// ==========================================

export interface GroupFormModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** The group being edited (null for create mode) */
    editingGroup: DeviceGroup | null;
    /** Current form data */
    formData: CreateDeviceGroupRequest;
    /** Validation errors keyed by field name */
    formErrors: Record<string, string>;
    /** Whether a save operation is in progress */
    isSaving: boolean;
    /** Device options for the multi-select */
    deviceOptions: DeviceOption[];
    /** Callback to update form data */
    onFormChange: (updater: (prev: CreateDeviceGroupRequest) => CreateDeviceGroupRequest) => void;
    /** Callback when the modal is closed */
    onClose: () => void;
    /** Callback when the form is submitted */
    onSubmit: () => void;
}

// ==========================================
// Component
// ==========================================

export const GroupFormModal = React.memo(function GroupFormModal({
    open,
    editingGroup,
    formData,
    formErrors,
    isSaving,
    deviceOptions,
    onFormChange,
    onClose,
    onSubmit,
}: GroupFormModalProps) {
    return (
        <Modal
            open={open}
            onRequestClose={onClose}
            onRequestSubmit={onSubmit}
            modalHeading={editingGroup ? 'Edit Device Group' : 'Create Device Group'}
            primaryButtonText={isSaving ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}
            secondaryButtonText="Cancel"
            primaryButtonDisabled={isSaving}
            size="md"
            hasScrollingContent
        >
            <div className="device-groups-page__form">
                <TextInput
                    id="group-name"
                    labelText="Group Name"
                    placeholder="e.g., Core Network, Floor 3 WiFi"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onFormChange((prev) => ({ ...prev, name: e.target.value }))
                    }
                    invalid={!!formErrors.name}
                    invalidText={formErrors.name}
                    maxLength={100}
                />

                <TextArea
                    id="group-description"
                    labelText="Description"
                    placeholder="Describe the purpose or scope of this device group..."
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        onFormChange((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                />

                <div className="device-groups-page__form-color-preview">
                    <div
                        className="device-groups-page__form-color-swatch"
                        style={{ '--swatch-color': formData.color } as React.CSSProperties}
                    />
                    <Dropdown
                        id="group-color"
                        titleText="Color"
                        label="Select a color"
                        items={COLOR_OPTIONS}
                        itemToString={(item: FilterOption | null) => item?.text || ''}
                        selectedItem={COLOR_OPTIONS.find(c => c.id === formData.color) || COLOR_OPTIONS[0]}
                        onChange={({ selectedItem }: { selectedItem: FilterOption | null }) => {
                            if (selectedItem) {
                                onFormChange((prev) => ({ ...prev, color: selectedItem.id }));
                            }
                        }}
                        invalid={!!formErrors.color}
                        invalidText={formErrors.color}
                    />
                </div>

                <FilterableMultiSelect
                    id="group-devices"
                    titleText="Devices"
                    placeholder="Search and select devices..."
                    items={deviceOptions}
                    itemToString={(item: DeviceOption) => item?.text || ''}
                    initialSelectedItems={deviceOptions.filter(d =>
                        formData.device_ids.includes(d.id)
                    )}
                    onChange={({ selectedItems }: { selectedItems: DeviceOption[] }) => {
                        onFormChange((prev) => ({
                            ...prev,
                            device_ids: selectedItems.map(item => item.id),
                        }));
                    }}
                    selectionFeedback="top-after-reopen"
                />
            </div>
        </Modal>
    );
});
