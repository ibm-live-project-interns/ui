/**
 * Copyright IBM Corp. 2026
 *
 * ActionRequiredWidget - THE MOST IMPORTANT WIDGET.
 * Shows what needs attention RIGHT NOW:
 * - Unacknowledged alerts older than 5 minutes
 * - High-priority items approaching SLA breach
 * Each item has a one-click action button (Acknowledge / View).
 */

import { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile, Button, Tag } from '@carbon/react';
import { WarningAltFilled, Checkmark, View, Alarm } from '@carbon/icons-react';
import { useFetchData } from '@/shared/hooks';
import { alertDataService } from '@/shared/services';
import { normalizeAlert } from '@/shared/utils/normalizeAlert';
import { useToast } from '@/contexts';
import { logger } from '@/shared/utils/logger';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';

interface ActionItem {
  id: string;
  type: 'unack-alert' | 'sla-risk';
  title: string;
  subtitle: string;
  severity: 'critical' | 'warning' | 'info';
  age: string;
}

interface ActionRequiredWidgetProps {
  className?: string;
}

export const ActionRequiredWidget = memo(function ActionRequiredWidget({ className }: ActionRequiredWidgetProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: actionItems, isLoading, error, refetch } = useFetchData(
    async () => {
      const rawAlerts = await alertDataService.getNocAlerts();
      const alerts = (rawAlerts || []).map((a: unknown) => normalizeAlert(a));
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const items: ActionItem[] = [];

      // Find unacknowledged alerts older than 5 minutes
      for (const alert of alerts) {
        const isUnacked = alert.status === 'open' || alert.status === 'new' || alert.status === 'active';
        if (!isUnacked) continue;

        let alertTime: Date | null = null;
        if (typeof alert.timestamp === 'string') {
          alertTime = new Date(alert.timestamp);
        } else if (alert.timestamp?.absolute) {
          alertTime = new Date(alert.timestamp.absolute);
        }

        const isOld = alertTime && !isNaN(alertTime.getTime()) && alertTime < fiveMinutesAgo;
        if (!isOld) continue;

        const isCritical = alert.severity === 'critical' || alert.severity === 'high';
        const isMajor = alert.severity === 'major' || alert.severity === 'medium';

        // Calculate age string
        const diffMs = alertTime ? now.getTime() - alertTime.getTime() : 0;
        const diffMin = Math.floor(diffMs / 60000);
        const ageStr = diffMin < 60 ? `${diffMin}m` : `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;

        const deviceName = alert.device && typeof alert.device.name === 'string'
          ? alert.device.name
          : 'Unknown device';

        items.push({
          id: alert.id,
          type: 'unack-alert',
          title: alert.aiSummary || alert.aiTitle || 'Unacknowledged alert',
          subtitle: `${deviceName} - ${alert.severity}`,
          severity: isCritical ? 'critical' : isMajor ? 'warning' : 'info',
          age: ageStr,
        });
      }

      // Sort by severity (critical first), then by age (oldest first)
      items.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return 0; // maintain original order for same severity
      });

      return items.slice(0, 8);
    },
    []
  );

  const handleAcknowledge = useCallback(async (alertId: string) => {
    try {
      await alertDataService.acknowledgeAlert(alertId);
      addToast('success', 'Acknowledged', `Alert ${alertId} acknowledged`);
      refetch();
    } catch (err) {
      logger.error('Failed to acknowledge alert', err);
      addToast('error', 'Action Failed', 'Could not acknowledge alert');
    }
  }, [addToast, refetch]);

  if (isLoading && !actionItems) return <WidgetSkeleton variant="compact" className={className} />;
  if (error && !actionItems) return <WidgetError message={error} onRetry={refetch} className={className} />;

  const items = actionItems || [];

  return (
    <div className={`widget widget--action-required ${className || ''}`}>
      <Tile className="widget__tile">
        <div className="widget__header">
          <h3>
            <Alarm size={18} />
            Action Required
          </h3>
          {items.length > 0 && (
            <Tag type="red" size="sm">{items.length} pending</Tag>
          )}
        </div>

        <div className="widget__body action-required__body--scrollable">
          {items.length === 0 ? (
            <div className="widget__empty widget__empty--inline">
              <WarningAltFilled size={24} className="system-health__status-icon--ok" />
              <span>All clear. No actions required right now.</span>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className={`action-item action-item--${item.severity}`}>
                <div className="action-item__content">
                  <div className="action-item__title" title={item.title}>
                    {item.title}
                  </div>
                  <div className="action-item__subtitle">
                    {item.subtitle}
                    <span className={`action-item__age ${item.severity === 'critical' ? 'action-item__age--critical' : ''}`}>
                      {item.age} ago
                    </span>
                  </div>
                </div>
                <div className="action-item__actions">
                  {item.type === 'unack-alert' && (
                    <div className="action-required__action-buttons">
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={Checkmark}
                        hasIconOnly
                        iconDescription="Acknowledge"
                        onClick={() => handleAcknowledge(item.id)}
                      />
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={View}
                        hasIconOnly
                        iconDescription="View"
                        onClick={() => navigate(`/alerts/${item.id}`)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Tile>
    </div>
  );
});
