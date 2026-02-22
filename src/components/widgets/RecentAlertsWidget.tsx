/**
 * Copyright IBM Corp. 2026
 *
 * RecentAlertsWidget - DataTable of recent alerts with ack/view actions.
 * Compact rows with severity tag, device, timestamp. Clickable to navigate to alert detail.
 * Extracted from NetworkOpsView recent alerts table.
 */

import { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tile, DataTable, TableContainer, Table, TableHead, TableRow,
  TableHeader, TableBody, TableCell, Button, Tag,
} from '@carbon/react';
import { View, Checkmark } from '@carbon/icons-react';
import { useFetchData } from '@/shared/hooks';
import { alertDataService } from '@/shared/services';
import { normalizeAlert } from '@/shared/utils/normalizeAlert';
import { getSeverityTag } from '@/shared/constants/severity';
import { getStatusTag } from '@/shared/constants/status';
import { useToast } from '@/contexts';
import { logger } from '@/shared/utils/logger';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';

interface RecentAlertsWidgetProps {
  className?: string;
  /** Max rows to display. Defaults to 5. */
  maxRows?: number;
}

const HEADERS = [
  { key: 'timestamp', header: 'TIME' },
  { key: 'device', header: 'DEVICE' },
  { key: 'severity', header: 'SEVERITY' },
  { key: 'summary', header: 'SUMMARY' },
  { key: 'status', header: 'STATUS' },
  { key: 'actions', header: '' },
];

export const RecentAlertsWidget = memo(function RecentAlertsWidget({ className, maxRows = 5 }: RecentAlertsWidgetProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: rawAlerts, isLoading, error, refetch } = useFetchData(
    async () => {
      const alerts = await alertDataService.getNocAlerts();
      return (alerts || []).map((a: unknown) => normalizeAlert(a));
    },
    []
  );

  const alerts = useMemo(() => (rawAlerts || []).slice(0, maxRows), [rawAlerts, maxRows]);

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

  const tableRows = useMemo(() =>
    alerts.map((alert) => {
      const ts = typeof alert.timestamp === 'string'
        ? alert.timestamp
        : alert.timestamp?.relative || 'N/A';

      const deviceName = alert.device && typeof alert.device.name === 'string'
        ? alert.device.name
        : 'Unknown';

      return {
        id: alert.id,
        timestamp: ts,
        device: deviceName,
        severity: alert.severity,
        summary: alert.aiSummary || 'No summary',
        status: alert.status,
        actions: '',
      };
    }),
    [alerts]
  );

  if (isLoading && !rawAlerts) return <WidgetSkeleton variant="table" className={className} />;
  if (error && !rawAlerts) return <WidgetError message={error} onRetry={refetch} className={className} />;

  return (
    <div className={`widget widget--table ${className || ''}`}>
      <Tile className="widget__tile recent-alerts__tile--flush">
        <div className="recent-alerts__header-area">
          <div className="widget__header">
            <h3>Recent Alerts</h3>
            <Button kind="ghost" size="sm" onClick={() => navigate('/priority-alerts')}>
              View all
            </Button>
          </div>
        </div>

        <DataTable rows={tableRows} headers={HEADERS} size="sm">
          {({ rows, headers: hdrs, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer aria-label="Recent alerts list">
              <Table {...getTableProps()} size="sm">
                <TableHead>
                  <TableRow>
                    {hdrs.map((header) => {
                      const { key: headerKey, ...headerProps } = getHeaderProps({ header });
                      return (
                        <TableHeader key={headerKey} {...headerProps}>
                          {header.header}
                        </TableHeader>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={HEADERS.length} className="recent-alerts__empty-cell">
                        No recent alerts
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => {
                      const alert = alerts.find((a) => a.id === row.id);
                      if (!alert) return null;
                      const { key: rowKey, ...rowProps } = getRowProps({ row });
                      return (
                        <TableRow key={rowKey} {...rowProps}>
                          <TableCell className="recent-alerts__timestamp-cell">
                            {typeof alert.timestamp === 'string' ? alert.timestamp : alert.timestamp?.relative || 'N/A'}
                          </TableCell>
                          <TableCell className="recent-alerts__device-cell">
                            {typeof alert.device?.name === 'string' ? alert.device.name : 'Unknown'}
                          </TableCell>
                          <TableCell>{getSeverityTag(alert.severity)}</TableCell>
                          <TableCell>
                            <span className="recent-alerts__summary-truncate">
                              {alert.aiSummary || 'No summary'}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusTag(alert.status)}</TableCell>
                          <TableCell>
                            <div className="recent-alerts__action-cell">
                              <Button kind="ghost" size="sm" renderIcon={View} hasIconOnly iconDescription="View" onClick={() => navigate(`/alerts/${alert.id}`)} />
                              <Button kind="ghost" size="sm" renderIcon={Checkmark} hasIconOnly iconDescription="Acknowledge" onClick={() => handleAcknowledge(alert.id)} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </Tile>
    </div>
  );
});
