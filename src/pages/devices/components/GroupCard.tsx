/**
 * Copyright IBM Corp. 2026
 *
 * GroupCard - Individual device group card display.
 * Shows colored border, group name, description, device count, and device tags.
 */

import React from 'react';
import { Tile, Tag } from '@carbon/react';
import { Edit, TrashCan } from '@carbon/icons-react';

import type { DeviceGroup } from '@/shared/services/deviceGroupService';
import type { Device } from '@/shared/types';
import { getDeviceDisplayName } from './deviceGroups.types';

// ==========================================
// Props
// ==========================================

export interface GroupCardProps {
    /** The device group to render */
    group: DeviceGroup;
    /** Full device list for resolving device names from IDs */
    allDevices: Device[];
    /** Callback when user clicks the edit button */
    onEdit: (group: DeviceGroup) => void;
    /** Callback when user clicks the delete button */
    onDelete: (group: DeviceGroup) => void;
}

// ==========================================
// Component
// ==========================================

export const GroupCard = React.memo(function GroupCard({
    group,
    allDevices,
    onEdit,
    onDelete,
}: GroupCardProps) {
    return (
        <Tile className="device-groups-page__card">
            {/* Colored top border */}
            <div
                className="device-groups-page__card-border"
                style={{ '--group-color': group.color || 'var(--cds-interactive, #4589ff)' } as React.CSSProperties}
            />

            <div className="device-groups-page__card-body">
                {/* Header: Title + Actions */}
                <div className="device-groups-page__card-header">
                    <div className="device-groups-page__card-title-section">
                        <h4 className="device-groups-page__card-title">{group.name}</h4>
                        {group.description && (
                            <p className="device-groups-page__card-description">
                                {group.description}
                            </p>
                        )}
                    </div>

                    <div className="device-groups-page__card-actions">
                        <button
                            type="button"
                            className="device-groups-page__icon-btn"
                            title="Edit group"
                            aria-label="Edit group"
                            onClick={() => onEdit(group)}
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            type="button"
                            className="device-groups-page__icon-btn device-groups-page__icon-btn--danger"
                            title="Delete group"
                            aria-label="Delete group"
                            onClick={() => onDelete(group)}
                        >
                            <TrashCan size={16} />
                        </button>
                    </div>
                </div>

                {/* Device count badge */}
                <div className="device-groups-page__card-count">
                    <Tag type="high-contrast" size="sm">
                        {group.device_ids.length} device{group.device_ids.length !== 1 ? 's' : ''}
                    </Tag>
                </div>

                {/* Device names list */}
                {group.device_ids.length > 0 && (
                    <div className="device-groups-page__card-devices">
                        {group.device_ids.slice(0, 5).map((deviceId) => (
                            <Tag
                                key={deviceId}
                                type="cool-gray"
                                size="sm"
                                className="device-groups-page__card-device-tag"
                            >
                                {getDeviceDisplayName(deviceId, allDevices)}
                            </Tag>
                        ))}
                        {group.device_ids.length > 5 && (
                            <span className="device-groups-page__card-more">
                                +{group.device_ids.length - 5} more
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Tile>
    );
});
