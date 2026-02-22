/**
 * Config Audit Log Widget
 *
 * Displays a timeline of recent system audit events (config changes,
 * user actions, alert operations) fetched from the backend audit-logs API.
 * Falls back gracefully when the API is not yet available or returns empty.
 */

import React, { useState, useEffect } from 'react';
import { SkeletonText } from '@carbon/react';
import { HttpService } from '@/shared/api';
import { env, API_ENDPOINTS } from '@/shared/config';
import { logger } from '@/shared/utils/logger';
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

export const ConfigAuditLog = React.memo(function ConfigAuditLog() {
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
                logger.warn('Failed to fetch audit logs for ConfigAuditLog widget', error);
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
        <div className="config-audit-log">
            <div className="kpi-header">
                <div className="kpi-title-group">
                    <span className="kpi-title">Config Audit Log</span>
                </div>
            </div>

            <div className="config-audit-log__body">
                {isLoading ? (
                    <div className="config-audit-log__skeleton-list">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="config-audit-log__skeleton-item">
                                <SkeletonText width="30%" />
                                <div className="config-audit-log__skeleton-line"><SkeletonText width="70%" /></div>
                                <div className="config-audit-log__skeleton-line"><SkeletonText width="40%" /></div>
                            </div>
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="config-audit-log__empty">
                        No audit log entries available
                    </div>
                ) : (
                    <>
                        {/* Timeline line */}
                        <div className="config-audit-log__timeline-line" />

                        {entries.map((entry, index) => (
                            <div
                                key={entry.id}
                                className={`config-audit-log__entry ${index < entries.length - 1 ? 'config-audit-log__entry--spaced' : ''}`}
                            >
                                <div className={`config-audit-log__dot ${entry.isFailure ? 'config-audit-log__dot--failure' : 'config-audit-log__dot--normal'}`} />
                                <div>
                                    <div className="config-audit-log__time">
                                        {entry.time}
                                    </div>
                                    <div className="config-audit-log__description">
                                        {entry.description}
                                        {entry.resourceName && (
                                            <> on <span className="config-audit-log__resource-link">{entry.resourceName}</span></>
                                        )}
                                    </div>
                                    <div className="config-audit-log__user">
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
});
