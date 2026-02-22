/**
 * Copyright IBM Corp. 2026
 *
 * Service Health Cards Component
 * Displays the 7 application-level service health cards with
 * response time, uptime progress bars, and status indicators.
 */

import React from 'react';
import {
  Tile,
  ProgressBar,
  Tag,
} from '@carbon/react';
import {
  CheckmarkFilled,
  WarningAltFilled,
  CloudServiceManagement,
  DataBase,
  Network_2,
  Activity,
  MachineLearningModel,
  MailAll,
  Catalog,
} from '@carbon/icons-react';

import { RelativeTime } from '@/components';

// ==========================================
// Types
// ==========================================

export interface ServiceInfo {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  response_time_ms: number;
  uptime_percent: number;
  last_check: string;
  details: string;
}

export interface LastIncident {
  title: string;
  occurred_at: string | null;
  resolved_at: string | null;
  duration_minutes: number;
}

interface ServiceHealthCardsProps {
  /** List of application service status objects */
  services: ServiceInfo[];
  /** Count of operational services */
  operationalCount: number;
  /** Count of degraded services */
  degradedCount: number;
  /** Count of down services */
  downCount: number;
  /** Last recorded incident (or null) */
  lastIncident: LastIncident | null;
}

// ==========================================
// Constants
// ==========================================

const SERVICE_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'API Gateway': CloudServiceManagement,
  'Database (PostgreSQL)': DataBase,
  'Event Router': Network_2,
  'Ingestor Core': Activity,
  'AI Analysis Engine': MachineLearningModel,
  'Email Service': MailAll,
  'Kafka Message Broker': Catalog,
};

// ==========================================
// Helpers
// ==========================================

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

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return 'N/A';
  if (minutes < 1) return '< 1m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ==========================================
// Component
// ==========================================

export const ServiceHealthCards = React.memo(function ServiceHealthCards({
  services,
  operationalCount,
  degradedCount,
  downCount,
  lastIncident,
}: ServiceHealthCardsProps) {
  return (
    <>
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
                    <span className="metric-value"><RelativeTime timestamp={service.last_check} refreshInterval={30000} /></span>
                  </div>
                  <div className="uptime-bar">
                    <ProgressBar
                      label={`${service.name} uptime: ${service.uptime_percent.toFixed(2)}%`}
                      value={service.uptime_percent}
                      max={100}
                      size="small"
                      hideLabel
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
    </>
  );
});
