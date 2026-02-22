/**
 * Copyright IBM Corp. 2026
 *
 * Service Status / Health Page
 * Displays comprehensive health and status information for all platform services,
 * including real Docker container status with log viewing capability.
 * Auto-refreshes every 10 seconds with a manual refresh button.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { InlineNotification } from '@carbon/react';
import { Renew } from '@carbon/icons-react';

// Reusable components
import { PageHeader, ComingSoonModal, useComingSoon } from '@/components';
import { PageLayout } from '@/components/layout';

// Child components
import { DockerContainerGrid } from './components/DockerContainerGrid';
import { ServiceHealthCards } from './components/ServiceHealthCards';
import { ContainerLogModal } from './components/ContainerLogModal';
import { ServiceStatusSkeleton } from './components/ServiceStatusSkeleton';
import { StatusBanner } from './components/StatusBanner';
import { SystemMetricsKPIs } from './components/SystemMetricsKPIs';

// Types and client
import type { ServiceStatusResponse, DockerServiceInfo } from './components/serviceStatus.types';
import { statusClient, REFRESH_INTERVAL_MS } from './components/serviceStatus.types';

// Hooks
import { useFetchData } from '@/shared/hooks';

// Context
import { useToast } from '@/contexts';

// Constants
import { ROUTES } from '@/shared/constants/routes';

// Styles
import '@/styles/pages/_service-status.scss';

// ==========================================
// Component
// ==========================================

export function ServiceStatusPage() {
  const { addToast } = useToast();
  const { open: comingSoonOpen, feature: comingSoonFeature, showComingSoon, hideComingSoon } = useComingSoon();

  // Additional UI state
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Application-level service status via useFetchData
  const { data, isLoading: appLoading, error, refetch: refetchApp } = useFetchData<ServiceStatusResponse>(
    async (_signal) => statusClient.getServiceStatus(),
    [],
  );

  // Docker container status via useFetchData
  const { data: dockerData, error: dockerError, refetch: refetchDocker } = useFetchData(
    async (_signal) => statusClient.getDockerStatus(),
    [],
  );

  const dockerServices: DockerServiceInfo[] = dockerData?.services ?? [];
  const dockerTimestamp: string = dockerData?.timestamp ?? '';

  // Derive combined loading from both fetches (only for initial load)
  const isLoading = appLoading && !data;

  // Log viewing modal
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsServiceName, setLogsServiceName] = useState('');
  const [logsContent, setLogsContent] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsDockerUnavailable, setLogsDockerUnavailable] = useState(false);
  const [logLines, setLogLines] = useState('100');

  // Combined refetch for both data sources
  const refetchAll = useCallback(() => {
    refetchApp();
    refetchDocker();
    setLastRefresh(new Date());
  }, [refetchApp, refetchDocker]);

  // Initial fetch + auto-refresh (respects user's auto-refresh setting)
  useEffect(() => {
    setLastRefresh(new Date());

    const autoRefreshSetting = localStorage.getItem('settings_autoRefresh');
    const autoRefreshEnabled = autoRefreshSetting !== 'false';
    if (autoRefreshEnabled) {
      intervalRef.current = setInterval(() => {
        refetchAll();
      }, REFRESH_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetchAll]);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetchAll();
    // Clear refreshing state after a brief delay since refetch is sync
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetchAll]);

  // Open logs modal for a service
  const handleViewLogs = useCallback(async (serviceName: string) => {
    setLogsServiceName(serviceName);
    setLogsModalOpen(true);
    setLogsLoading(true);
    setLogsContent('');
    setLogsError(null);
    setLogsDockerUnavailable(false);

    try {
      const response = await statusClient.getDockerLogs(serviceName, parseInt(logLines, 10));
      setLogsContent(response.logs ?? '');
      if (response.docker_unavailable) {
        setLogsDockerUnavailable(true);
      } else if (response.error) {
        setLogsError(response.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch logs';
      setLogsError(message);
    } finally {
      setLogsLoading(false);
    }
  }, [logLines]);

  // Refresh logs with new line count
  const handleRefreshLogs = useCallback(async () => {
    if (!logsServiceName) return;
    setLogsLoading(true);
    setLogsError(null);
    setLogsDockerUnavailable(false);

    try {
      const response = await statusClient.getDockerLogs(logsServiceName, parseInt(logLines, 10));
      setLogsContent(response.logs ?? '');
      if (response.docker_unavailable) {
        setLogsDockerUnavailable(true);
      } else if (response.error) {
        setLogsError(response.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch logs';
      setLogsError(message);
    } finally {
      setLogsLoading(false);
    }
  }, [logsServiceName, logLines]);

  // Close logs modal
  const handleCloseLogsModal = useCallback(() => {
    setLogsModalOpen(false);
    setLogsContent('');
    setLogsServiceName('');
    setLogsDockerUnavailable(false);
  }, []);

  // Restart requires Docker socket access which is not yet available
  const handleRestart = useCallback((serviceName: string) => {
    showComingSoon({
      name: 'Service Restart',
      description: `Restarting "${serviceName}" requires Docker socket access and is currently under development. Use the Docker CLI or Docker Desktop to restart services manually.`,
    });
  }, [showComingSoon]);

  // ==========================================
  // Loading State
  // ==========================================
  if (isLoading && !data) {
    return <ServiceStatusSkeleton />;
  }

  // ==========================================
  // Error State (both sources failed, no cached data)
  // ==========================================
  if (error && !data && dockerServices.length === 0) {
    return (
      <PageLayout>
      <div className="service-status-page">
        <PageHeader
          breadcrumbs={[
            { label: 'Dashboard', href: ROUTES.DASHBOARD },
            { label: 'Service Status', active: true },
          ]}
          title="Service Status"
          subtitle="Real-time health monitoring for all platform services."
          actions={[
            {
              label: 'Retry',
              icon: Renew,
              variant: 'primary',
              onClick: handleRefresh,
            },
          ]}
          showBorder
        />

        <div className="service-status-page__content">
          <InlineNotification
            kind="error"
            title="Unable to load service status"
            subtitle={error}
            lowContrast
            hideCloseButton
          />
        </div>
      </div>
      </PageLayout>
    );
  }

  // ==========================================
  // Render
  // ==========================================
  const services = data?.services ?? [];
  const lastIncident = data?.last_incident ?? null;

  const operationalCount = services.filter((s) => s.status === 'operational').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  const downCount = services.filter((s) => s.status === 'down').length;

  const dockerRunning = dockerServices.filter((s) => s.status === 'running').length;
  const dockerStopped = dockerServices.filter((s) => s.status === 'stopped').length;
  const dockerTotal = dockerServices.length;

  return (
    <PageLayout>
    <div className="service-status-page">
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Service Status', active: true },
        ]}
        title="Service Status"
        subtitle="Real-time health monitoring for all platform services."
        actions={[
          {
            label: isRefreshing ? 'Refreshing...' : 'Refresh',
            icon: Renew,
            variant: 'secondary',
            onClick: handleRefresh,
            loading: isRefreshing,
          },
        ]}
        showBorder
      />

      <div className="service-status-page__content">
        {/* Error notification (non-blocking, shown alongside stale data) */}
        {error && data && (
          <InlineNotification
            kind="warning"
            title="Refresh failed"
            subtitle={`Showing cached data. ${error}`}
            lowContrast
            className="service-status-page__stale-warning"
          />
        )}

        {/* Overall Status Banner */}
        <StatusBanner
          overallStatus={data?.overall_status ?? 'operational'}
          totalServices={services.length}
          operationalCount={operationalCount}
          lastRefresh={lastRefresh}
        />

        {/* System Metrics KPI Row */}
        <SystemMetricsKPIs metrics={data?.system_metrics} />

        {/* Docker Container Status Section */}
        <DockerContainerGrid
          dockerServices={dockerServices}
          dockerTimestamp={dockerTimestamp}
          dockerError={dockerError}
          dockerStopped={dockerStopped}
          dockerRunning={dockerRunning}
          dockerTotal={dockerTotal}
          onViewLogs={handleViewLogs}
          onRestart={handleRestart}
        />

        {/* Application Services + Last Incident */}
        <ServiceHealthCards
          services={services}
          operationalCount={operationalCount}
          degradedCount={degradedCount}
          downCount={downCount}
          lastIncident={lastIncident}
        />
      </div>

      {/* Logs Modal */}
      <ContainerLogModal
        open={logsModalOpen}
        serviceName={logsServiceName}
        logsContent={logsContent}
        logsLoading={logsLoading}
        logsError={logsError}
        logsDockerUnavailable={logsDockerUnavailable}
        logLines={logLines}
        onClose={handleCloseLogsModal}
        onLogLinesChange={setLogLines}
        onRefreshLogs={handleRefreshLogs}
      />

      {/* Toast notifications handled by shared ToastProvider */}

      {/* Coming Soon Modal */}
      <ComingSoonModal open={comingSoonOpen} onClose={hideComingSoon} feature={comingSoonFeature} />
    </div>
    </PageLayout>
  );
}

export default ServiceStatusPage;
