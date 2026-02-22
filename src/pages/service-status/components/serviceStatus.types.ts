/**
 * Service Status Page - Types, Constants & Helpers
 *
 * Shared types, HTTP client, and utility functions used by
 * ServiceStatusPage and its child components.
 */

import type { CarbonIconType } from '@carbon/icons-react';
import {
  CheckmarkFilled,
  WarningAltFilled,
  ErrorFilled,
  Activity,
} from '@carbon/icons-react';

import { HttpService } from '@/shared/api';
import { env, API_ENDPOINTS } from '@/shared/config';
import type { DockerServiceInfo } from './DockerContainerGrid';
import type { ServiceInfo, LastIncident } from './ServiceHealthCards';

// ==========================================
// Types
// ==========================================

export interface SystemMetrics {
  total_alerts_24h: number;
  total_events_24h: number;
  avg_response_time_ms: number;
  error_rate_percent: number;
}

export interface ServiceStatusResponse {
  overall_status: 'operational' | 'degraded' | 'outage';
  services: ServiceInfo[];
  system_metrics: SystemMetrics;
  last_incident: LastIncident | null;
}

export interface DockerStatusResponse {
  services: DockerServiceInfo[];
  timestamp: string;
}

export interface DockerLogsResponse {
  service: string;
  logs: string;
  error?: string;
  docker_unavailable?: boolean;
  lines: string;
}

export interface OverallStatusConfig {
  title: string;
  subtitle: string;
  icon: CarbonIconType;
  iconColor: string;
}

// ==========================================
// Constants
// ==========================================

/** Auto-refresh interval in milliseconds (10 seconds) */
export const REFRESH_INTERVAL_MS = 10_000;

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

export const statusClient = new ServiceStatusClient();

// ==========================================
// Helpers
// ==========================================

export function getOverallStatusConfig(status: string): OverallStatusConfig {
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

// Re-export child component types
export type { DockerServiceInfo } from './DockerContainerGrid';
export type { ServiceInfo, LastIncident } from './ServiceHealthCards';
