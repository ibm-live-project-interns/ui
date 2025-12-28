/**
 * AlertViewModel - Transforms Alert data for display
 * Provides formatted labels, relative times, and display-ready data
 * 
 * Note: This uses models/Alert.ts types for API-level data transformation.
 * For UI components, use types from @/constants instead.
 */

import type { Alert, AlertSeverity, AlertStatus, FormattedAlert, SeverityTagKind } from './Alert';
import { formatTimestamp, getRelativeTime, truncateText } from '../services/utils';

// Severity mapping for API types
const SEVERITY_INFO: Record<AlertSeverity, { label: string; kind: SeverityTagKind }> = {
    critical: { label: 'Critical', kind: 'red' },
    high: { label: 'High', kind: 'magenta' },
    medium: { label: 'Medium', kind: 'purple' },
    low: { label: 'Low', kind: 'blue' },
    info: { label: 'Info', kind: 'cyan' },
};

const STATUS_LABELS: Record<AlertStatus, string> = {
    active: 'Active',
    acknowledged: 'Acknowledged',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
    snmp_trap: 'SNMP Trap',
    syslog: 'Syslog',
};

export class AlertViewModel {
    private readonly alert: Alert;

    constructor(alert: Alert) {
        this.alert = alert;
    }

    get id(): string { return this.alert.id; }
    get severity(): AlertSeverity { return this.alert.severity; }
    get status(): AlertStatus { return this.alert.status; }
    get explanation(): string { return this.alert.explanation; }
    get recommendedActions() { return this.alert.recommendedActions; }
    get device() { return this.alert.device; }
    get sourceType() { return this.alert.sourceType; }
    get rawMessage(): string { return this.alert.rawLog.message; }

    get severityLabel(): string {
        return SEVERITY_INFO[this.severity].label;
    }

    get severityKind(): SeverityTagKind {
        return SEVERITY_INFO[this.severity].kind;
    }

    get statusLabel(): string {
        return STATUS_LABELS[this.status];
    }

    get sourceTypeLabel(): string {
        return SOURCE_TYPE_LABELS[this.sourceType] || this.sourceType;
    }

    get formattedTime(): string {
        return formatTimestamp(this.alert.timestamp);
    }

    get relativeTime(): string {
        return getRelativeTime(this.alert.timestamp);
    }

    get explanationSnippet(): string {
        return truncateText(this.explanation, 150);
    }

    get canCreateTicket(): boolean {
        return this.status === 'active' && ['critical', 'high'].includes(this.severity);
    }

    get isActive(): boolean {
        return this.status === 'active';
    }

    get isCritical(): boolean {
        return this.severity === 'critical';
    }

    toFormatted(): FormattedAlert {
        return {
            id: this.id,
            severity: this.severity,
            severityLabel: this.severityLabel,
            severityKind: this.severityKind,
            status: this.status,
            statusLabel: this.statusLabel,
            explanation: this.explanation,
            explanationSnippet: this.explanationSnippet,
            recommendedActions: this.recommendedActions,
            device: {
                hostname: this.device.hostname,
                ipAddress: this.device.ipAddress,
                type: this.device.deviceType,
            },
            sourceType: this.sourceType,
            sourceTypeLabel: this.sourceTypeLabel,
            rawMessage: this.rawMessage,
            formattedTime: this.formattedTime,
            relativeTime: this.relativeTime,
        };
    }
}
