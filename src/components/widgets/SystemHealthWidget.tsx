/**
 * Copyright IBM Corp. 2026
 *
 * SystemHealthWidget - System runtime and health stats.
 * Uses GET /health endpoint for system status.
 * Shows service status indicators. For sysadmin only.
 */

import { memo } from 'react';
import { Tile, Tag, ProgressBar } from '@carbon/react';
import { Activity, CheckmarkFilled, Misuse } from '@carbon/icons-react';
import { useFetchData } from '@/shared/hooks';
import { env, API_ENDPOINTS } from '@/shared/config';
import { HttpService } from '@/shared/api';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';

interface HealthResponse {
  status: string;
  database?: string;
  kafka?: string;
  uptime?: string;
  version?: string;
  go_version?: string;
  goroutines?: number;
  memory_mb?: number;
}

interface SystemHealthWidgetProps {
  className?: string;
}

class HealthHttpClient extends HttpService {
  constructor() {
    const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
    const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
    super(apiPath);
  }
  async fetchHealth(): Promise<HealthResponse> {
    try {
      return await this.get<HealthResponse>(API_ENDPOINTS.HEALTH);
    } catch {
      return { status: 'unreachable' };
    }
  }
}

const healthClient = new HealthHttpClient();

export const SystemHealthWidget = memo(function SystemHealthWidget({ className }: SystemHealthWidgetProps) {
  const { data, isLoading, error, refetch } = useFetchData(
    async () => healthClient.fetchHealth(),
    []
  );

  if (isLoading && !data) return <WidgetSkeleton variant="compact" className={className} />;
  if (error && !data) return <WidgetError message={error} onRetry={refetch} className={className} />;
  if (!data) return null;

  const isHealthy = data.status === 'ok' || data.status === 'healthy';
  const dbStatus = data.database === 'connected' || data.database === 'ok';
  const kafkaStatus = data.kafka === 'connected' || data.kafka === 'ok';

  const services = [
    { name: 'API Gateway', status: isHealthy },
    { name: 'Database', status: dbStatus },
    { name: 'Kafka', status: kafkaStatus },
  ];

  return (
    <div className={`widget widget--compact ${className || ''}`}>
      <Tile className="widget__tile">
        <div className="widget__header">
          <h3>
            <Activity size={18} />
            System Health
          </h3>
          <Tag type={isHealthy ? 'green' : 'red'} size="sm">
            {isHealthy ? 'Healthy' : 'Degraded'}
          </Tag>
        </div>

        <div className="widget__body">
          {/* Service status indicators */}
          <div className="system-health__services">
            {services.map((svc) => (
              <div key={svc.name} className="system-health__service-row">
                <span className="system-health__service-name">{svc.name}</span>
                <div className="system-health__service-status">
                  {svc.status
                    ? <CheckmarkFilled size={16} className="system-health__status-icon--ok" />
                    : <Misuse size={16} className="system-health__status-icon--down" />
                  }
                  <span className={`system-health__status-label ${svc.status ? 'system-health__status-icon--ok' : 'system-health__status-icon--down'}`}>
                    {svc.status ? 'OK' : 'Down'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Runtime info */}
          <div className="system-health__runtime">
            {data.uptime && <div>Uptime: <strong className="system-health__runtime-value">{data.uptime}</strong></div>}
            {data.version && <div>Version: <strong className="system-health__runtime-value">{data.version}</strong></div>}
            {data.go_version && <div>Go: <strong className="system-health__runtime-value">{data.go_version}</strong></div>}
            {data.goroutines != null && (
              <div>
                Goroutines: <strong className="system-health__runtime-value">{data.goroutines}</strong>
              </div>
            )}
            {data.memory_mb != null && (
              <div className="system-health__memory-section">
                <div className="system-health__memory-header">
                  <span>Memory</span>
                  <strong className="system-health__runtime-value">{data.memory_mb} MB</strong>
                </div>
                <ProgressBar
                  label="Memory"
                  value={Math.min(data.memory_mb, 512)}
                  max={512}
                  size="small"
                  hideLabel
                  status={data.memory_mb > 400 ? 'error' : data.memory_mb > 256 ? 'active' : 'finished'}
                />
              </div>
            )}
          </div>
        </div>
      </Tile>
    </div>
  );
});
