/**
 * Copyright IBM Corp. 2026
 *
 * Docker Container Grid Component
 * Displays a grid of Docker container status cards with metadata,
 * status/health tags, and action buttons for viewing logs and restarting.
 */

import React from 'react';
import {
  Tile,
  Button,
  Tag,
  InlineNotification,
} from '@carbon/react';
import {
  Terminal,
  Restart,
  ContainerSoftware,
  CloudServiceManagement,
  DataBase,
  Catalog,
  Network_2,
  Activity,
  MachineLearningModel,
  Application,
  ViewFilled,
  Dashboard,
  ChartLineData,
} from '@carbon/icons-react';

import { RelativeTime } from '@/components';

// ==========================================
// Types
// ==========================================

export interface DockerServiceInfo {
  name: string;
  status: string; // "running", "stopped", "restarting", "paused"
  health: string; // "healthy", "unhealthy", "starting", "none"
  uptime: string;
  port: string;
  container: string;
  image: string;
}

interface DockerContainerGridProps {
  /** List of Docker service information */
  dockerServices: DockerServiceInfo[];
  /** Timestamp of when Docker status was last queried */
  dockerTimestamp: string;
  /** Error message if Docker status fetch failed */
  dockerError: string | null;
  /** Total count of stopped containers */
  dockerStopped: number;
  /** Total count of running containers */
  dockerRunning: number;
  /** Total count of Docker containers */
  dockerTotal: number;
  /** Callback when "View Logs" button is clicked */
  onViewLogs: (serviceName: string) => void;
  /** Callback when "Restart" button is clicked */
  onRestart: (serviceName: string) => void;
}

// ==========================================
// Constants
// ==========================================

const DOCKER_SERVICE_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'api-gateway': CloudServiceManagement,
  'postgres': DataBase,
  'kafka': Catalog,
  'zookeeper': ContainerSoftware,
  'event-router': Network_2,
  'ingestor-core': Activity,
  'ai-core': MachineLearningModel,
  'ui': Application,
  'kafka-ui': Dashboard,
  'pgadmin': ViewFilled,
  'datasource': ChartLineData,
};

// ==========================================
// Helpers
// ==========================================

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
// Component
// ==========================================

export const DockerContainerGrid = React.memo(function DockerContainerGrid({
  dockerServices,
  dockerTimestamp,
  dockerError,
  dockerStopped,
  dockerRunning,
  dockerTotal,
  onViewLogs,
  onRestart,
}: DockerContainerGridProps) {
  return (
    <div className="service-status-page__docker-section">
      <div className="section-title-row">
        <h3 className="section-title">
          <ContainerSoftware size={20} className="section-title-icon" />
          Docker Containers
          {dockerTotal > 0 && (
            <Tag type={dockerStopped > 0 ? 'red' : 'green'} size="sm" className="section-title-tag">
              {dockerRunning}/{dockerTotal} Running
            </Tag>
          )}
        </h3>
        {dockerTimestamp && (
          <span className="docker-timestamp">
            Queried <RelativeTime timestamp={dockerTimestamp} refreshInterval={10000} />
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
          className="docker-notification"
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
                    onClick={() => onViewLogs(svc.name)}
                  >
                    View Logs
                  </Button>
                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={Restart}
                    onClick={() => onRestart(svc.name)}
                    disabled
                    title="Restart is not available -- requires Docker socket access"
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
  );
});
