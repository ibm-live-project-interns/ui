/**
 * Dashboard Header Component
 *
 * Consistent header for all dashboard pages matching Network Operations Center style.
 * Features: Left-aligned title/subtitle, right-aligned system status tag
 */

import { Tag } from '@carbon/react';
import { Checkmark } from '@carbon/icons-react';
import './DashboardHeader.scss';

export type SystemStatus = 'operational' | 'degraded' | 'down';

export interface DashboardHeaderProps {
    title: string;
    subtitle?: string;
    systemStatus?: SystemStatus;
    rightContent?: React.ReactNode;
}

export function DashboardHeader({
    title,
    subtitle,
    systemStatus,
    rightContent
}: DashboardHeaderProps) {
    const getStatusConfig = () => {
        switch (systemStatus) {
            case 'operational':
                return { type: 'green' as const, text: 'System Operational', icon: <Checkmark size={16} /> };
            case 'degraded':
                return { type: 'magenta' as const, text: 'System Degraded', icon: null };
            case 'down':
                return { type: 'red' as const, text: 'System Down', icon: null };
            default:
                return null;
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <div className="dashboard-header">
            <div className="header-left">
                <h1 className="dashboard-title">{title}</h1>
                {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
            </div>
            <div className="header-right">
                {rightContent}
                {statusConfig && (
                    <Tag type={statusConfig.type} size="md" className="status-tag">
                        {statusConfig.icon}
                        {statusConfig.text}
                    </Tag>
                )}
            </div>
        </div>
    );
}

export default DashboardHeader;
