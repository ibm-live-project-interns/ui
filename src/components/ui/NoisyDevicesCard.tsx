/**
 * Noisy Devices Card Component
 *
 * Reusable component for displaying top noisy devices.
 * Used in Dashboard (simple) and Trends page (with gradient/streaks).
 *
 * @example
 * // Simple variant (Dashboard) - shows alert count
 * <NoisyDevicesCard devices={devices} variant="simple" />
 *
 * // Gradient variant (Trends) - shows alert count with severity gradient
 * <NoisyDevicesCard devices={devices} variant="gradient" showViewAll />
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile, Button } from '@carbon/react';
import { SEVERITY_CONFIG, getSeverityBackgroundClass } from '@/shared/constants/severity';
import { getDeviceIcon } from '@/shared/constants/devices';
import type { Severity, DeviceInfo } from '@/shared/types/common.types';
import '@/styles/components/_noisy-devices.scss';

// ==========================================
// Types
// ==========================================

export interface NoisyDeviceItem {
    device: DeviceInfo;
    model?: string;
    alertCount: number;
    severity: Severity;
}

export interface NoisyDevicesCardProps {
    title?: string;
    subtitle?: string;
    devices: NoisyDeviceItem[];
    variant?: 'simple' | 'gradient';
    showViewAll?: boolean;
    onViewAll?: () => void;
}

// ==========================================
// Component
// ==========================================

export const NoisyDevicesCard = React.memo(function NoisyDevicesCard({
    title = 'Top Noisy Devices',
    subtitle,
    devices,
    variant = 'simple',
    showViewAll = true,
    onViewAll,
}: NoisyDevicesCardProps) {
    const navigate = useNavigate();

    const handleViewAll = () => {
        if (onViewAll) {
            onViewAll();
        } else {
            navigate('/devices');
        }
    };

    return (
        <Tile className={`noisy-devices-card noisy-devices-card--${variant}`}>
            <div className="noisy-devices-header">
                <div className="noisy-devices-title-group">
                    <h3>{title}</h3>
                    {subtitle && <p className="noisy-devices-subtitle">{subtitle}</p>}
                </div>
                {showViewAll && (
                    <Button kind="primary" size="sm" onClick={handleViewAll}>
                        View All
                    </Button>
                )}
            </div>
            <div className="noisy-devices-list">
                {(!devices || devices.length === 0) ? (
                    <div className="noisy-devices-empty">
                        No noisy devices detected.
                    </div>
                ) : (
                    devices.map((item, idx) => (
                        <div
                            key={typeof item.device.name === 'string' ? item.device.name : `device-${idx}`}
                            className={`noisy-device-row ${variant === 'gradient' ? `noisy-device-row--${item.severity}` : ''}`}
                        >
                            {/* Gradient background for trends variant */}
                            {variant === 'gradient' && (
                                <div className="device-gradient-bg" />
                            )}

                            <div className="device-left">
                                <div className={getSeverityBackgroundClass(item.severity)}>
                                    {getDeviceIcon(item.device.icon)}
                                </div>
                                <div className="device-details">
                                    <div className="device-name">{typeof item.device.name === 'object' ? JSON.stringify(item.device.name) : item.device.name}</div>
                                        <div className="device-secondary">
                                            {(() => {
                                                const candidate = item.model ?? item.device.model ?? item.device.ip ?? '';
                                                return typeof candidate === 'object' ? JSON.stringify(candidate) : candidate;
                                            })()}
                                        </div>
                                </div>
                            </div>

                            <div className="device-right">
                                <div
                                    className="alerts-count"
                                    style={variant === 'gradient' ? { color: SEVERITY_CONFIG[item.severity].color } : undefined}
                                >
                                    {item.alertCount}
                                </div>
                                <div className="alerts-label">alerts</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Tile>
    );
});

export default NoisyDevicesCard;
