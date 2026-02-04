/**
 * Device Information Card Component
 *
 * Displays device details in a structured format:
 * - Device Name, IP Address, Location
 * - Vendor, Model, Interface
 * - Interface Alias
 */

import { Tile } from '@carbon/react';
import { VirtualMachine } from '@carbon/icons-react';
import '@/styles/pages/_alert-details.scss';

interface DeviceInfo {
    deviceName: string;
    ipAddress: string;
    location: string;
    vendor: string;
    model: string;
    interface?: string;
    interfaceAlias?: string;
}

interface DeviceInfoCardProps {
    device: DeviceInfo;
}

export function DeviceInfoCard({ device }: DeviceInfoCardProps) {
    const infoRows = [
        { label: 'Device Name', value: device.deviceName },
        { label: 'IP Address', value: device.ipAddress },
        { label: 'Location', value: device.location },
        { label: 'Vendor', value: device.vendor },
        { label: 'Model', value: device.model },
        ...(device.interface ? [{ label: 'Interface', value: device.interface, highlight: true }] : []),
        ...(device.interfaceAlias ? [{ label: 'Interface Alias', value: device.interfaceAlias }] : []),
    ];

    return (
        <Tile className="device-info-card">
            <div className="device-info-card__header">
                <VirtualMachine size={20} />
                <h4 className="device-info-card__title">Device Information</h4>
            </div>

            <div className="device-info-card__content">
                {infoRows.map((row, index) => (
                    <div key={index} className="device-info-card__row">
                        <span className="device-info-card__label">{row.label}</span>
                        <span
                            className={`device-info-card__value ${row.highlight ? 'device-info-card__value--highlight' : ''}`}
                        >
                            {row.value}
                        </span>
                    </div>
                ))}
            </div>
        </Tile>
    );
}

export default DeviceInfoCard;
