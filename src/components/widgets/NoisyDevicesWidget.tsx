/**
 * Copyright IBM Corp. 2026
 *
 * NoisyDevicesWidget - Top noisy devices card.
 * Wraps the existing NoisyDevicesCard component with self-contained data fetching.
 * Extracted from NetworkOpsView noisy devices section.
 */

import { memo, useMemo } from 'react';
import { useFetchData } from '@/shared/hooks';
import { alertDataService } from '@/shared/services';
import { NoisyDevicesCard, type NoisyDeviceItem } from '@/components/ui';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';

interface NoisyDevicesWidgetProps {
  className?: string;
}

export const NoisyDevicesWidget = memo(function NoisyDevicesWidget({ className }: NoisyDevicesWidgetProps) {
  const { data: noisyDevices, isLoading, error, refetch } = useFetchData(
    async () => alertDataService.getNoisyDevices(),
    []
  );

  // Transform API data to NoisyDeviceItem format
  const deviceItems: NoisyDeviceItem[] = useMemo(() => {
    if (!noisyDevices || noisyDevices.length === 0) return [];

    return noisyDevices.map((d): NoisyDeviceItem => {
      const data = d as Record<string, unknown>;

      // Extract name - ensure it's always a string
      let deviceName = 'Unknown Device';
      if (typeof d.name === 'string') {
        deviceName = d.name;
      } else if (data.device && typeof data.device === 'object' && typeof (data.device as Record<string, unknown>).name === 'string') {
        deviceName = (data.device as Record<string, string>).name;
      } else if (typeof data.device_name === 'string') {
        deviceName = data.device_name;
      }

      // Extract IP - ensure it's always a string
      let deviceIp = '';
      if (data.device && typeof data.device === 'object' && typeof (data.device as Record<string, unknown>).ip === 'string') {
        deviceIp = (data.device as Record<string, string>).ip;
      } else if (typeof data.device_ip === 'string') {
        deviceIp = data.device_ip;
      }

      const alertCount = d.alertCount || 0;

      return {
        device: {
          name: String(deviceName),
          ip: String(deviceIp),
          icon: 'switch' as const,
        },
        alertCount,
        severity: alertCount > 10 ? 'critical' : alertCount > 5 ? 'major' : 'minor',
      };
    });
  }, [noisyDevices]);

  if (isLoading && !noisyDevices) return <WidgetSkeleton variant="compact" className={className} />;
  if (error && !noisyDevices) return <WidgetError message={error} onRetry={refetch} className={className} />;

  if (deviceItems.length === 0) {
    return (
      <div className={`widget ${className || ''}`}>
        <NoisyDevicesCard title="Top Noisy Devices" devices={[]} variant="simple" />
      </div>
    );
  }

  return (
    <div className={`widget ${className || ''}`}>
      <NoisyDevicesCard title="Top Noisy Devices" devices={deviceItems} variant="simple" />
    </div>
  );
});
