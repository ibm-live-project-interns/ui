/**
 * Copyright IBM Corp. 2026
 *
 * Service Status / Health Page
 * Displays comprehensive health and status information for all platform services,
 * including real Docker container status with log viewing capability.
 * Auto-refreshes every 15 seconds with a manual refresh button.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Tile,
  Button,
  ProgressBar,
  SkeletonText,
  SkeletonPlaceholder,
  InlineNotification,
  Tag,
  Modal,
  Loading,
  Dropdown,
  ToastNotification,
} from '@carbon/react';
import {
  Renew,
  CheckmarkFilled,
  WarningAltFilled,
  ErrorFilled,
  Activity,
  Time,
  EventSchedule,
  ChartLineData,
  DataBase,
  CloudServiceManagement,
  Network_2,
  MachineLearning,
  MailAll,
  Catalog,
  Terminal,
  Restart,
  ContainerSoftware,
  Application,
  ViewFilled,
  Dashboard,
} from '@carbon/icons-react';

// Reusable components
import { KPICard, PageHeader } from '@/components';

// Config
import { env, API_ENDPOINTS } from '@/shared/config';
import { HttpService } from '@/shared/api';

// Constants
import { ROUTES } from '@/shared/constants/routes';

// Styles
import '@/styles/pages/_service-status.scss';

// ==========================================
// Types
// ==========================================

interface ServiceInfo {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  response_time_ms: number;
  uptime_percent: number;
  last_check: string;
  details: string;
}

interface SystemMetrics {
  total_alerts_24h: number;
  total_events_24h: number;
  avg_response_time_ms: number;
  error_rate_percent: number;
}

interface LastIncident {
  title: string;
  occurred_at: string | null;
  resolved_at: string | null;
  duration_minutes: number;
}

interface ServiceStatusResponse {
  overall_status: 'operational' | 'degraded' | 'outage';
  services: ServiceInfo[];
  system_metrics: SystemMetrics;
  last_incident: LastIncident | null;
}

/** Docker container info from GET /api/v1/services/status */
interface DockerServiceInfo {
  name: string;
  status: string; // "running", "stopped", "restarting", "paused"
  health: string; // "healthy", "unhealthy", "starting", "none"
  uptime: string;
  port: string;
  container: string;
  image: string;
}

interface DockerStatusResponse {
  services: DockerServiceInfo[];
  timestamp: string;
}

interface DockerLogsResponse {
  service: string;
  logs: string;
  error?: string;
  docker_unavailable?: boolean;
  lines: string;
}

// ==========================================
// HTTP Client
// ==========================================

class ServiceStatusClient extends HttpService {
  constructor() {
    super(`${env.apiBaseUrl}/api/${env.apiVersion}`, 'ServiceStatus');
  }

  async getServiceStatus(): Promise<ServiceStatusResponse> {
    return this.get<ServiceStatusResponse>(API_ENDPOINTS.SERVICE_STATUS);
  }

  async getDockerStatus(): Promise<DockerStatusResponse> {
    return this.get<DockerStatusResponse>(API_ENDPOINTS.DOCKER_SERVICES_STATUS);
  }

  async getDockerLogs(serviceName: string, lines: number = 100): Promise<DockerLogsResponse> {
    return this.get<DockerLogsResponse>(
      `${API_ENDPOINTS.DOCKER_SERVICE_LOGS(serviceName)}?lines=${lines}`
    );
  }
}

const statusClient = new ServiceStatusClient();

// ==========================================
// Service Icon Map (for application services)
// ==========================================

const SERVICE_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'API Gateway': CloudServiceManagement,
  'Database (PostgreSQL)': DataBase,
  'Event Router': Network_2,
  'Ingestor Core': Activity,
  'AI Analysis Engine': MachineLearning,
  'Email Service': MailAll,
  'Kafka Message Broker': Catalog,
};

// Icon map for Docker services (matched by container/service name)
const DOCKER_SERVICE_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'api-gateway': CloudServiceManagement,
  'postgres': DataBase,
  'kafka': Catalog,
  'zookeeper': ContainerSoftware,
  'event-router': Network_2,
  'ingestor-core': Activity,
  'ai-core': MachineLearning,
  'ui': Application,
  'kafka-ui': Dashboard,
  'pgadmin': ViewFilled,
  'datasource': ChartLineData,
};

// ==========================================
// Helper Functions
// ==========================================

function getOverallStatusConfig(status: string) {
  switch (status) {
    case 'operational':
      return {
        title: 'All Systems Operational',
        subtitle: 'All services are running normally. No issues detected.',
        icon: CheckmarkFilled,
        iconColor: '#24a148',
      };
    case 'degraded':
      return {
        title: 'Partial System Degradation',
        subtitle: 'Some services are experiencing issues. Monitoring in progress.',
        icon: WarningAltFilled,
        iconColor: '#f5a524',
      };
    case 'outage':
    case 'down':
      return {
        title: 'System Outage Detected',
        subtitle: 'One or more critical services are down. The team is investigating.',
        icon: ErrorFilled,
        iconColor: '#da1e28',
      };
    default:
      return {
        title: 'Status Unknown',
        subtitle: 'Unable to determine system status.',
        icon: Activity,
        iconColor: '#525252',
      };
  }
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 60) return 'just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return '';
  }
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return 'N/A';
  if (minutes < 1) return '< 1m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Map Docker status to a color-coded tag type */
function getDockerStatusTagType(status: string): 'green' | 'red' | 'warm-gray' | 'cyan' | 'gray' {
  switch (status) {
    case 'running':
      return 'green';
    case 'stopped':
      return 'red';
    case 'restarting':
      return 'warm-gray';
    case 'paused':
      return 'cyan';
    default:
      return 'gray';
  }
}

/** Map Docker health to a color-coded tag type */
function getDockerHealthTagType(health: string): 'green' | 'red' | 'warm-gray' | 'gray' {
  switch (health) {
    case 'healthy':
      return 'green';
    case 'unhealthy':
      return 'red';
    case 'starting':
      return 'warm-gray';
    default:
      return 'gray';
  }
}

// ==========================================
// Auto-refresh interval (15 seconds)
// ==========================================
const REFRESH_INTERVAL_MS = 15_000;

const LOG_LINE_OPTIONS = [
  { id: '50', text: '50 lines' },
  { id: '100', text: '100 lines' },
  { id: '200', text: '200 lines' },
  { id: '500', text: '500 lines' },
  { id: '1000', text: '1000 lines' },
];

// ==========================================
// Component
// ==========================================

export function ServiceStatusPage() {
  // Application-level service status
  const [data, setData] = useState<ServiceStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Docker container status
  const [dockerServices, setDockerServices] = useState<DockerServiceInfo[]>([]);
  const [dockerTimestamp, setDockerTimestamp] = useState<string>('');
  const [dockerError, setDockerError] = useState<string | null>(null);

  // Log viewing modal
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsServiceName, setLogsServiceName] = useState('');
  const [logsContent, setLogsContent] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsDockerUnavailable, setLogsDockerUnavailable] = useState(false);
  const [logLines, setLogLines] = useState('100');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch application-level service status
  const fetchAppStatus = useCallback(async () => {
    try {
      const response = await statusClient.getServiceStatus();
      setData(response);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch service status';
      setError(message);
    }
  }, []);

  // Fetch Docker container status
  const fetchDockerStatus = useCallback(async () => {
    try {
      const response = await statusClient.getDockerStatus();
      setDockerServices(response.services ?? []);
      setDockerTimestamp(response.timestamp ?? '');
      setDockerError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch Docker status';
      setDockerError(message);
    }
  }, []);

  // Combined fetch
  const fetchAll = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setIsRefreshing(true);
      }

      await Promise.allSettled([fetchAppStatus(), fetchDockerStatus()]);

      setLastRefresh(new Date());
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [fetchAppStatus, fetchDockerStatus]
  );

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchAll();

    intervalRef.current = setInterval(() => {
      fetchAll();
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAll]);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    fetchAll(true);
  }, [fetchAll]);

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

  // Restart button handler (placeholder toast)
  const handleRestart = useCallback((serviceName: string) => {
    setToastMessage(`Restart requested for "${serviceName}". This action requires Docker socket access and is not yet implemented.`);
    // Clear toast after 5 seconds
    setTimeout(() => setToastMessage(null), 5000);
  }, []);

  // ==========================================
  // Loading State
  // ==========================================
  if (isLoading && !data) {
    return (
      <div className="service-status-page">
        <PageHeader
          breadcrumbs={[
            { label: 'Dashboard', href: ROUTES.DASHBOARD },
            { label: 'Service Status', active: true },
          ]}
          title="Service Status"
          subtitle="Real-time health monitoring for all platform services."
          showBorder
        />

        <div style={{ padding: '0 1rem' }}>
          <SkeletonPlaceholder className="service-status-page__skeleton-banner" />

          <div className="kpi-row">
            {[1, 2, 3, 4].map((i) => (
              <KPICard key={i} label="" value="" loading />
            ))}
          </div>

          <div className="service-status-page__skeleton-grid">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <SkeletonPlaceholder key={i} className="skeleton-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Error State (both sources failed, no cached data)
  // ==========================================
  if (error && !data && dockerServices.length === 0) {
    return (
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

        <div style={{ padding: '0 1rem' }}>
          <InlineNotification
            kind="error"
            title="Unable to load service status"
            subtitle={error}
            lowContrast
            hideCloseButton
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // Render
  // ==========================================
  const statusConfig = getOverallStatusConfig(data?.overall_status ?? 'operational');
  const StatusIcon = statusConfig.icon;
  const metrics = data?.system_metrics;
  const services = data?.services ?? [];
  const lastIncident = data?.last_incident;

  // Count services by status
  const operationalCount = services.filter((s) => s.status === 'operational').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  const downCount = services.filter((s) => s.status === 'down').length;

  // Docker service counts
  const dockerRunning = dockerServices.filter((s) => s.status === 'running').length;
  const dockerStopped = dockerServices.filter((s) => s.status === 'stopped').length;
  const dockerTotal = dockerServices.length;

  return (
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

      <div style={{ padding: '0 1rem' }}>
        {/* Error notification (non-blocking, shown alongside stale data) */}
        {error && data && (
          <InlineNotification
            kind="warning"
            title="Refresh failed"
            subtitle={`Showing cached data. ${error}`}
            lowContrast
            style={{ marginBottom: '1rem' }}
          />
        )}

        {/* Overall Status Banner */}
        <div className={`service-status-page__banner service-status-page__banner--${data?.overall_status ?? 'operational'}`}>
          <StatusIcon size={32} className="banner-icon" style={{ color: statusConfig.iconColor }} />
          <div className="banner-content">
            <h2 className="banner-title">{statusConfig.title}</h2>
            <p className="banner-subtitle">{statusConfig.subtitle}</p>
          </div>
          <div className="banner-actions">
            {lastRefresh && (
              <span className="last-refresh">
                Updated {formatTimeAgo(lastRefresh.toISOString())}
              </span>
            )}
            <Tag type={data?.overall_status === 'operational' ? 'green' : data?.overall_status === 'degraded' ? 'warm-gray' : 'red'} size="sm">
              {operationalCount}/{services.length} Healthy
            </Tag>
          </div>
        </div>

        {/* System Metrics KPI Row */}
        <div className="kpi-row">
          <KPICard
            label="Alerts (24h)"
            value={metrics?.total_alerts_24h ?? 0}
            icon={Activity}
            iconColor="#da1e28"
            severity={
              (metrics?.total_alerts_24h ?? 0) > 200
                ? 'critical'
                : (metrics?.total_alerts_24h ?? 0) > 100
                  ? 'major'
                  : 'info'
            }
            subtitle="Active alerts in last 24 hours"
          />
          <KPICard
            label="Events (24h)"
            value={(metrics?.total_events_24h ?? 0).toLocaleString()}
            icon={ChartLineData}
            iconColor="#0f62fe"
            severity="info"
            subtitle="Total events processed"
          />
          <KPICard
            label="Avg Response Time"
            value={`${metrics?.avg_response_time_ms ?? 0}ms`}
            icon={Time}
            iconColor="#42be65"
            severity={
              (metrics?.avg_response_time_ms ?? 0) > 500
                ? 'critical'
                : (metrics?.avg_response_time_ms ?? 0) > 200
                  ? 'major'
                  : 'success'
            }
            subtitle="API response latency"
          />
          <KPICard
            label="Error Rate"
            value={`${(metrics?.error_rate_percent ?? 0).toFixed(2)}%`}
            icon={EventSchedule}
            iconColor={
              (metrics?.error_rate_percent ?? 0) > 5 ? '#da1e28' : '#42be65'
            }
            severity={
              (metrics?.error_rate_percent ?? 0) > 5
                ? 'critical'
                : (metrics?.error_rate_percent ?? 0) > 1
                  ? 'major'
                  : 'success'
            }
            subtitle="Critical alert ratio"
          />
        </div>

        {/* ============================================ */}
        {/* Docker Container Status Section              */}
        {/* ============================================ */}
        <div className="service-status-page__docker-section">
          <div className="section-title-row">
            <h3 className="section-title">
              <ContainerSoftware size={20} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
              Docker Containers
              {dockerTotal > 0 && (
                <Tag type={dockerStopped > 0 ? 'red' : 'green'} size="sm" style={{ marginLeft: '0.75rem' }}>
                  {dockerRunning}/{dockerTotal} Running
                </Tag>
              )}
            </h3>
            {dockerTimestamp && (
              <span className="docker-timestamp">
                Queried {formatTimeAgo(dockerTimestamp)}
              </span>
            )}
          </div>

          {dockerError && dockerServices.length === 0 && (
            <InlineNotification
              kind="info"
              title="Docker status unavailable"
              subtitle={dockerError}
              lowContrast
              hideCloseButton
              style={{ marginBottom: '1rem' }}
            />
          )}

          {dockerServices.length > 0 && (
            <div className="service-status-page__docker-grid">
              {dockerServices.map((svc) => {
                const SvcIcon = DOCKER_SERVICE_ICON_MAP[svc.name] ?? ContainerSoftware;
                return (
                  <Tile
                    key={svc.container || svc.name}
                    className={`service-status-page__docker-card service-status-page__docker-card--${svc.status}`}
                  >
                    <div className="docker-card-header">
                      <div className="docker-name-row">
                        <span className={`status-dot status-dot--${svc.status}`} />
                        <SvcIcon size={16} />
                        <h4 className="docker-name">{svc.name}</h4>
                      </div>
                      <div className="docker-tags">
                        <Tag type={getDockerStatusTagType(svc.status)} size="sm">
                          {svc.status}
                        </Tag>
                        {svc.health !== 'none' && (
                          <Tag type={getDockerHealthTagType(svc.health)} size="sm">
                            {svc.health}
                          </Tag>
                        )}
                      </div>
                    </div>

                    <div className="docker-card-meta">
                      {svc.image && (
                        <div className="docker-meta-row">
                          <span className="meta-label">Image</span>
                          <span className="meta-value" title={svc.image}>
                            {svc.image.length > 35 ? `...${svc.image.slice(-32)}` : svc.image}
                          </span>
                        </div>
                      )}
                      {svc.port && (
                        <div className="docker-meta-row">
                          <span className="meta-label">Port</span>
                          <span className="meta-value">{svc.port}</span>
                        </div>
                      )}
                      {svc.uptime && (
                        <div className="docker-meta-row">
                          <span className="meta-label">Uptime</span>
                          <span className="meta-value">{svc.uptime}</span>
                        </div>
                      )}
                      {svc.container && (
                        <div className="docker-meta-row">
                          <span className="meta-label">Container</span>
                          <span className="meta-value" title={svc.container}>
                            {svc.container.length > 28 ? `${svc.container.slice(0, 25)}...` : svc.container}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="docker-card-actions">
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={Terminal}
                        onClick={() => handleViewLogs(svc.name)}
                      >
                        View Logs
                      </Button>
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={Restart}
                        onClick={() => handleRestart(svc.name)}
                      >
                        Restart
                      </Button>
                    </div>
                  </Tile>
                );
              })}
            </div>
          )}
        </div>

        {/* Application Services Grid */}
        <div className="service-status-page__services-section">
          <h3 className="section-title">
            Application Health ({operationalCount} operational
            {degradedCount > 0 ? `, ${degradedCount} degraded` : ''}
            {downCount > 0 ? `, ${downCount} down` : ''})
          </h3>
          <div className="service-status-page__services-grid">
            {services.map((service) => {
              const ServiceIcon = SERVICE_ICON_MAP[service.name] ?? CloudServiceManagement;
              return (
                <Tile
                  key={service.name}
                  className={`service-status-page__service-card service-status-page__service-card--${service.status}`}
                >
                  <div className="service-card-header">
                    <div className="service-name-row">
                      <span className={`status-indicator status-indicator--${service.status}`} />
                      <ServiceIcon size={16} />
                      <h4 className="service-name">{service.name}</h4>
                    </div>
                    <span className={`status-badge status-badge--${service.status}`}>
                      {service.status}
                    </span>
                  </div>

                  <p className="service-details">{service.details}</p>

                  <div className="service-metrics">
                    <div className="service-metric-row">
                      <span className="metric-label">Response Time</span>
                      <span className="metric-value">{service.response_time_ms}ms</span>
                    </div>
                    <div className="service-metric-row">
                      <span className="metric-label">Uptime</span>
                      <span className="metric-value">{service.uptime_percent.toFixed(2)}%</span>
                    </div>
                    <div className="service-metric-row">
                      <span className="metric-label">Last Check</span>
                      <span className="metric-value">{formatTimeAgo(service.last_check)}</span>
                    </div>
                    <div className="uptime-bar">
                      <ProgressBar
                        label=""
                        value={service.uptime_percent}
                        max={100}
                        size="small"
                        status={
                          service.uptime_percent >= 99.5
                            ? 'active'
                            : service.uptime_percent >= 95
                              ? 'active'
                              : 'error'
                        }
                      />
                    </div>
                  </div>
                </Tile>
              );
            })}
          </div>
        </div>

        {/* Last Incident */}
        <div className="service-status-page__incident-section">
          <h3 className="section-title">Last Incident</h3>
          {lastIncident ? (
            <Tile className="service-status-page__incident-card">
              <WarningAltFilled size={24} className="incident-icon" />
              <div className="incident-content">
                <h4 className="incident-title">{lastIncident.title}</h4>
                <div className="incident-meta">
                  <div className="incident-meta-item">
                    <span className="meta-label">Occurred</span>
                    <span className="meta-value">{formatDateTime(lastIncident.occurred_at)}</span>
                  </div>
                  <div className="incident-meta-item">
                    <span className="meta-label">Resolved</span>
                    <span className="meta-value">{formatDateTime(lastIncident.resolved_at)}</span>
                  </div>
                  <div className="incident-meta-item">
                    <span className="meta-label">Duration</span>
                    <span className="meta-value">{formatDuration(lastIncident.duration_minutes)}</span>
                  </div>
                  <div className="incident-meta-item">
                    <span className="meta-label">Status</span>
                    <Tag type="green" size="sm">Resolved</Tag>
                  </div>
                </div>
              </div>
            </Tile>
          ) : (
            <Tile className="service-status-page__no-incident">
              <div className="no-incident-content">
                <CheckmarkFilled size={24} className="no-incident-icon" />
                <p className="no-incident-text">
                  No recent incidents recorded. All systems have been stable.
                </p>
              </div>
            </Tile>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* Logs Modal                                   */}
      {/* ============================================ */}
      <Modal
        open={logsModalOpen}
        onRequestClose={() => setLogsModalOpen(false)}
        modalHeading={`Logs: ${logsServiceName}`}
        passiveModal
        size="lg"
        className="service-status-page__logs-modal"
      >
        <div className="logs-modal-controls">
          <Dropdown
            id="log-lines-dropdown"
            titleText="Lines"
            items={LOG_LINE_OPTIONS}
            itemToString={(item: { id: string; text: string } | null) => item?.text ?? ''}
            selectedItem={LOG_LINE_OPTIONS.find((o) => o.id === logLines) ?? LOG_LINE_OPTIONS[1]}
            onChange={({ selectedItem }: { selectedItem: { id: string; text: string } | null }) => {
              if (selectedItem) {
                setLogLines(selectedItem.id);
              }
            }}
            size="sm"
          />
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Renew}
            onClick={handleRefreshLogs}
            disabled={logsLoading}
          >
            Refresh
          </Button>
        </div>

        {logsDockerUnavailable && (
          <InlineNotification
            kind="info"
            title="Docker not available"
            subtitle="Log retrieval requires Docker socket access. To enable, mount /var/run/docker.sock into the api-gateway container."
            lowContrast
            hideCloseButton
            style={{ marginBottom: '0.5rem' }}
          />
        )}

        {logsError && !logsDockerUnavailable && (
          <InlineNotification
            kind="warning"
            title="Log retrieval issue"
            subtitle={logsError}
            lowContrast
            hideCloseButton
            style={{ marginBottom: '0.5rem' }}
          />
        )}

        <div className="logs-modal-content">
          {logsLoading ? (
            <div className="logs-loading">
              <Loading withOverlay={false} small description="Loading logs..." />
              <span>Fetching logs...</span>
            </div>
          ) : (
            <pre className="logs-output">{logsContent || 'No log output available.'}</pre>
          )}
        </div>
      </Modal>

      {/* Toast notification */}
      {toastMessage && (
        <div className="service-status-page__toast-container">
          <ToastNotification
            kind="info"
            title="Action"
            subtitle={toastMessage}
            timeout={5000}
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}
    </div>
  );
}

export default ServiceStatusPage;
