/**
 * Copyright IBM Corp. 2026
 *
 * DeviceHealthWidget - Device status summary with health percentages.
 * Shows up/down/degraded/warning counts with progress bars.
 * Extracted from NetworkAdminView device stats.
 */

import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile, ProgressBar, Button, Tag } from '@carbon/react';
import { CheckmarkFilled, Misuse, Warning, Router } from '@carbon/icons-react';
import { useFetchData } from '@/shared/hooks';
import { deviceService } from '@/shared/services';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';

interface DeviceHealthWidgetProps {
  className?: string;
}

export const DeviceHealthWidget = memo(function DeviceHealthWidget({ className }: DeviceHealthWidgetProps) {
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useFetchData(
    async () => {
      const [devices, stats] = await Promise.all([
        deviceService.getDevices(),
        deviceService.getDeviceStats(),
      ]);
      return { devices, stats };
    },
    []
  );

  const healthBreakdown = useMemo(() => {
    if (!data) return [];
    const { stats: s } = data;
    const total = s.total || 1;
    return [
      { label: 'Online', count: s.online, percent: Math.round((s.online / total) * 100), color: 'var(--cds-support-success)', icon: CheckmarkFilled },
      { label: 'Warning', count: s.warning, percent: Math.round((s.warning / total) * 100), color: 'var(--cds-support-warning)', icon: Warning },
      { label: 'Critical', count: s.critical, percent: Math.round((s.critical / total) * 100), color: 'var(--cds-support-error)', icon: Warning },
      { label: 'Offline', count: s.offline, percent: Math.round((s.offline / total) * 100), color: 'var(--cds-text-disabled)', icon: Misuse },
    ];
  }, [data]);

  if (isLoading && !data) return <WidgetSkeleton variant="chart" className={className} />;
  if (error && !data) return <WidgetError message={error} onRetry={refetch} className={className} />;
  if (!data) return null;

  const { stats: s } = data;

  return (
    <div className={`widget widget--device-health ${className || ''}`}>
      <Tile className="widget__tile">
        <div className="widget__header">
          <h3>
            <Router size={18} />
            Device Health
          </h3>
          <Button kind="ghost" size="sm" onClick={() => navigate('/devices')}>
            View all
          </Button>
        </div>

        <div className="device-health__tags">
          <Tag type="blue" size="sm">{s.total} Total</Tag>
          <Tag type="green" size="sm">{s.online} Online</Tag>
          {(s.warning + s.critical) > 0 && (
            <Tag type="red" size="sm">{s.warning + s.critical} Issues</Tag>
          )}
        </div>

        <div className="widget__body">
          {healthBreakdown.map((item) => (
            <div key={item.label} className="device-health__bar">
              <span className="device-health__label">
                <item.icon size={14} className={`device-health__icon device-health__icon--${item.label.toLowerCase()}`} />
                {item.label}
              </span>
              <div className="device-health__progress">
                <ProgressBar
                  label={item.label}
                  value={item.percent}
                  max={100}
                  size="small"
                  hideLabel
                  status={item.label === 'Online' ? 'finished' : item.label === 'Offline' ? 'error' : 'active'}
                />
              </div>
              <span className="device-health__count">{item.count}</span>
            </div>
          ))}
        </div>
      </Tile>
    </div>
  );
});
