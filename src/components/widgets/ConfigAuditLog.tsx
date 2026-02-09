/**
 * Config Audit Log Widget
 *
 * Displays a timeline of recent system audit events (config changes,
 * user actions, alert operations) fetched from the backend audit-logs API.
 * Falls back gracefully when the API is not yet available or returns empty.
 */

import { useState, useEffect } from 'react';
import { SkeletonText } from '@carbon/react';
import { HttpService } from '@/shared/api';
import { env, API_ENDPOINTS } from '@/shared/config';
import '@/styles/components/_kpi-card.scss';

/** Audit log entry returned from the backend */
interface AuditLogEntry {
    id: number;
    created_at: string;
    user_id: number;
    username: string;
    action: string;
    resource: string;
    resource_id: string;
    details: Record<string, unknown>;
    ip_address: string;
    result: string;
}

/** Transformed entry for display */
interface AuditDisplayEntry {
    id: number;
    time: string;
    description: string;
    resourceName: string;
    username: string;
    isFailure: boolean;
}

/**
 * Format a human-readable action description from the raw audit log entry.
 */
function formatAction(entry: AuditLogEntry): { description: string; resourceName: string } {
    const details = entry.details || {};
    const resourceId = entry.resource_id || '';

    switch (entry.action) {
        case 'config.update':
            return {
                description: `${String(details.field || 'Setting')} updated`,
                resourceName: resourceId,
            };
        case 'config.create':
            return {
                description: `${String(details.type || entry.resource)} created`,
                resourceName: String(details.name || resourceId),
            };
        case 'user.create':
            return {
                description: 'User created',
                resourceName: String(details.email || resourceId),
            };
        case 'user.update':
            return {
                description: `${String(details.field || 'User')} changed`,
                resourceName: resourceId,
            };
        case 'user.delete':
            return {
                description: 'User deleted',
                resourceName: String(details.username || resourceId),
            };
        case 'user.login':
            return {
                description: entry.result === 'failure' ? 'Failed login attempt' : 'User logged in',
                resourceName: '',
            };
        case 'alert.acknowledge':
            return {
                description: 'Alert acknowledged',
                resourceName: resourceId,
            };
        case 'alert.resolve':
            return {
                description: 'Alert resolved',
                resourceName: resourceId,
            };
        case 'ticket.create':
            return {
                description: 'Ticket created',
                resourceName: String(details.title || resourceId),
            };
        case 'ticket.update':
            return {
                description: `Ticket ${String(details.old_value || '')} -> ${String(details.new_value || 'updated')}`,
                resourceName: resourceId,
            };
        case 'report.export':
            return {
                description: `Report exported (${String(details.format || 'csv')})`,
                resourceName: '',
            };
        default:
            return {
                description: entry.action.replace('.', ' '),
                resourceName: resourceId,
            };
    }
}

/**
 * Format a timestamp into a relative or short time string.
 */
function formatTime(timestamp: string): string {
    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return timestamp;

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        // For older entries, show short date
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return timestamp;
    }
}

/** Lightweight API client scoped to the audit-logs endpoint */
class AuditLogClient extends HttpService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = `${baseUrl}/api/${env.apiVersion}`;
        super(apiPath);
    }

    async getRecentLogs(limit = 5): Promise<AuditLogEntry[]> {
        const response = await this.get<{ audit_logs: AuditLogEntry[]; total: number }>(
            `${API_ENDPOINTS.AUDIT_LOGS}?limit=${limit}`
        );
        return response?.audit_logs || [];
    }
}

const auditClient = new AuditLogClient();

export function ConfigAuditLog() {
    const [entries, setEntries] = useState<AuditDisplayEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchLogs = async () => {
            try {
                const logs = await auditClient.getRecentLogs(5);
                if (cancelled) return;

                const displayEntries: AuditDisplayEntry[] = logs.map(log => {
                    const { description, resourceName } = formatAction(log);
                    return {
                        id: log.id,
                        time: formatTime(log.created_at),
                        description,
                        resourceName,
                        username: log.username || 'system',
                        isFailure: log.result === 'failure',
                    };
                });

                setEntries(displayEntries);
            } catch (error) {
                console.warn('[ConfigAuditLog] Failed to fetch audit logs:', error);
                // Leave entries empty -- the widget shows an empty state
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 60000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="kpi-card" style={{ height: '100%' }}>
            <div className="kpi-header">
                <div className="kpi-title-group">
                    <span className="kpi-title">Config Audit Log</span>
                </div>
            </div>

            <div style={{ marginTop: '1rem', position: 'relative' }}>
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ paddingLeft: '2rem' }}>
                                <SkeletonText width="30%" />
                                <SkeletonText width="70%" style={{ marginTop: '0.25rem' }} />
                                <SkeletonText width="40%" style={{ marginTop: '0.25rem' }} />
                            </div>
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <div style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
                        No audit log entries available
                    </div>
                ) : (
                    <>
                        {/* Timeline line */}
                        <div style={{
                            position: 'absolute',
                            left: '7px',
                            top: '8px',
                            bottom: '20px',
                            width: '2px',
                            backgroundColor: 'var(--cds-border-subtle-01, #393939)',
                        }} />

                        {entries.map((entry, index) => (
                            <div
                                key={entry.id}
                                style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    marginBottom: index < entries.length - 1 ? '1.5rem' : 0,
                                }}
                            >
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    border: `2px solid ${entry.isFailure ? 'var(--cds-support-error, #da1e28)' : 'var(--cds-icon-secondary, #8d8d8d)'}`,
                                    backgroundColor: 'var(--cds-layer-01, #161616)',
                                    zIndex: 1,
                                    flexShrink: 0,
                                }} />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper, #c6c6c6)' }}>
                                        {entry.time}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500, margin: '2px 0' }}>
                                        {entry.description}
                                        {entry.resourceName && (
                                            <> on <span style={{ color: 'var(--cds-link-primary, #4589ff)' }}>{entry.resourceName}</span></>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper, #8d8d8d)' }}>
                                        by {entry.username}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
