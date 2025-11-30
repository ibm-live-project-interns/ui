import type { Alert, AlertSeverity, AlertStatus, FormattedAlert } from '../../models';
import { SeverityMapper } from '../../domain/mappers/SeverityMapper';
import { StatusMapper } from '../../domain/mappers/StatusMapper';
import { SourceTypeMapper } from '../../domain/mappers/SourceTypeMapper';
import { formatTimestamp, getRelativeTime, truncateText } from '../../utils';

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
    return SeverityMapper.getInstance().map(this.severity).label;
  }

  get severityKind() {
    return SeverityMapper.getInstance().map(this.severity).kind;
  }

  get statusLabel(): string {
    return StatusMapper.getInstance().map(this.status).label;
  }

  get sourceTypeLabel(): string {
    return SourceTypeMapper.getInstance().map(this.sourceType).label;
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
