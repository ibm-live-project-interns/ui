import { useEffect, useState, useCallback, useMemo } from 'react';
import { Grid, Column, InlineNotification } from '@carbon/react';
import { Activity, Network_2 as Network, Time } from '@carbon/icons-react';
import { alertService } from '../services';
import { AlertViewModel } from '../presentation/viewmodels/AlertViewModel';
import { RecentAlertsTable, StatCard } from '../components/dashboard';
import type { SeverityDistribution, FormattedAlert, Alert } from '../models';

/** Dashboard: alert summary and severity visualization @see docs/arch/UI/README.md */
export function DashboardPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [distribution, setDistribution] = useState<SeverityDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [alertsData, distributionData] = await Promise.all([
        alertService.fetchAlerts(),
        alertService.getSeverityDistribution(),
      ]);

      setAlerts(alertsData);
      setDistribution(distributionData);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Improved: Only poll when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleAcknowledge = async (alertId: string) => {
    await alertService.updateAlertStatus(alertId, 'acknowledged');
    fetchDashboardData();
  };

  const handleResolve = async (alertId: string) => {
    await alertService.updateAlertStatus(alertId, 'resolved');
    fetchDashboardData();
  };

  const formattedAlerts: FormattedAlert[] = useMemo(
    () => alerts.map(alert => new AlertViewModel(alert).toFormatted()),
    [alerts]
  );

  // Calculate stats - memoized to prevent recalculation on every render
  const stats = useMemo(() => {
    const activeAlerts = alerts.filter(a => a.status === 'active').length;
    const criticalCount = distribution?.critical || 0;
    const uniqueDevices = new Set(alerts.map(a => a.device.id)).size;
    return { activeAlerts, criticalCount, uniqueDevices };
  }, [alerts, distribution]);

  return (
    <Grid className="dashboard-page">

      {/* Page Header */}
      <Column lg={16} md={8} sm={4}>
        <h1 className="page-title">Alert Dashboard</h1>
        <p className="page-description">
          Real-time monitoring of SNMP traps and syslog alerts with AI-powered analysis.
        </p>
      </Column>

      {/* Error Notification */}
      {error && (
        <Column lg={16} md={8} sm={4}>
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            onCloseButtonClick={() => setError(null)}
          />
        </Column>
      )}

      {/* Stats Row */}
      <Column lg={4} md={2} sm={4}>
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          subtitle="Require attention"
          icon={<Activity size={24} />}
          variant={stats.activeAlerts > 0 ? 'warning' : 'default'}
          loading={loading}
        />
      </Column>
      <Column lg={4} md={2} sm={4}>
        <StatCard
          title="Critical"
          value={stats.criticalCount}
          subtitle="High priority"
          icon={<Activity size={24} />}
          variant={stats.criticalCount > 0 ? 'error' : 'default'}
          loading={loading}
        />
      </Column>
      <Column lg={4} md={2} sm={4}>
        <StatCard
          title="Devices"
          value={stats.uniqueDevices}
          subtitle="With alerts"
          icon={<Network size={24} />}
          loading={loading}
        />
      </Column>
      <Column lg={4} md={2} sm={4}>
        <StatCard
          title="Last Update"
          value={loading ? '...' : 'Just now'}
          subtitle="Auto-refreshing"
          icon={<Time size={24} />}
          loading={loading}
        />
      </Column>

      {/* Recent Alerts Table */}
      <Column lg={16} md={8} sm={4}>
        <RecentAlertsTable
          alerts={formattedAlerts}
          loading={loading}
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
        />
      </Column>
    </Grid>
  );
}
