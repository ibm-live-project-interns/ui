/**
 * Copyright IBM Corp. 2026
 *
 * AuditActivityWidget - Recent audit log entries for sysadmin.
 * Compact list of recent actions with timestamps and users.
 */

import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile, Button, Tag } from '@carbon/react';
import { RecentlyViewed, Security } from '@carbon/icons-react';
import { useFetchData } from '@/shared/hooks';
import { env, API_ENDPOINTS } from '@/shared/config';
import { HttpService } from '@/shared/api';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';

interface AuditEntry {
  id: string;
  action: string;
  username: string;
  resource: string;
  resource_id?: string;
  created_at: string;
}

interface AuditActivityWidgetProps {
  className?: string;
}

// Lightweight HTTP client for audit logs
class AuditHttpClient extends HttpService {
  constructor() {
    const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
    const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
    super(apiPath);
  }
  async fetchRecent(): Promise<AuditEntry[]> {
    try {
      const response = await this.get<{ audit_logs?: AuditEntry[]; logs?: AuditEntry[]; data?: AuditEntry[] }>(
        `${API_ENDPOINTS.AUDIT_LOGS}?limit=8&sort=created_at&order=desc`
      );
      // Backend returns { audit_logs: [...], total, stats } - check all possible field names
      return response.audit_logs || response.logs || response.data || [];
    } catch {
      return [];
    }
  }
}

const auditClient = new AuditHttpClient();

export const AuditActivityWidget = memo(function AuditActivityWidget({ className }: AuditActivityWidgetProps) {
  const navigate = useNavigate();

  const { data: entries, isLoading, error, refetch } = useFetchData(
    async () => auditClient.fetchRecent(),
    []
  );

  const items = useMemo(() => (entries || []).slice(0, 8), [entries]);

  const formatTime = (ts: string) => {
    try {
      const date = new Date(ts);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return `${Math.floor(diffHr / 24)}d ago`;
    } catch {
      return ts;
    }
  };

  const getActionColor = (action: string): 'red' | 'blue' | 'green' | 'gray' | 'purple' => {
    const a = action.toLowerCase();
    if (a.includes('delete') || a.includes('remove')) return 'red';
    if (a.includes('create') || a.includes('add')) return 'green';
    if (a.includes('update') || a.includes('edit')) return 'blue';
    if (a.includes('login') || a.includes('auth')) return 'purple';
    return 'gray';
  };

  if (isLoading && !entries) return <WidgetSkeleton variant="compact" className={className} />;
  if (error && !entries) return <WidgetError message={error} onRetry={refetch} className={className} />;

  return (
    <div className={`widget widget--audit-activity ${className || ''}`}>
      <Tile className="widget__tile">
        <div className="widget__header">
          <h3>
            <RecentlyViewed size={18} />
            Recent Activity
          </h3>
          <Button kind="ghost" size="sm" onClick={() => navigate('/admin/audit-log')}>
            View all
          </Button>
        </div>

        <div className="widget__body">
          {items.length === 0 ? (
            <div className="widget__empty">No recent audit activity</div>
          ) : (
            items.map((entry) => (
              <div key={entry.id} className="audit-item">
                <div className="audit-item__icon">
                  <Security size={16} />
                </div>
                <div className="audit-item__content">
                  <div className="audit-item__action">
                    <Tag type={getActionColor(entry.action)} size="sm" className="audit-activity__tag-gap">
                      {entry.action}
                    </Tag>
                    {entry.resource && (
                      <span className="audit-activity__resource-text">
                        {entry.resource}
                        {entry.resource_id ? ` #${entry.resource_id.slice(0, 8)}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="audit-item__meta">
                    <span>{entry.username}</span>
                    <span>{formatTime(entry.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Tile>
    </div>
  );
});
