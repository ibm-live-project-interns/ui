import type { Alert } from '../../models/Alert';
import type { Incident, CreateIncidentRequest } from '../../services/TicketingService';

/**
 * Factory for creating Incident domain objects
 * Centralizes Incident creation logic from Alerts
 */
export class IncidentFactory {
  private static instance: IncidentFactory;

  private constructor() {}

  static getInstance(): IncidentFactory {
    if (!IncidentFactory.instance) {
      IncidentFactory.instance = new IncidentFactory();
    }
    return IncidentFactory.instance;
  }

  /**
   * Create Incident request from Alert
   */
  createRequestFromAlert(alert: Alert): CreateIncidentRequest {
    const severityMap: Record<string, string> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
      info: 'low',
    };

    return {
      alertId: alert.id,
      title: `Alert: ${alert.device.hostname} - ${alert.explanation.substring(0, 80)}`,
      description: this.buildDescription(alert),
      severity: severityMap[alert.severity] || 'medium',
      category: this.determineCategory(alert),
      additionalInfo: {
        sourceType: alert.sourceType,
        deviceId: alert.device.id,
        timestamp: alert.timestamp.toISOString(),
      },
    };
  }

  /**
   * Create Incident from API response
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createFromApiResponse(data: any): Incident {
    return {
      id: data.id,
      alertId: data.alertId || data.alert_id,
      title: data.title,
      description: data.description,
      severity: data.severity,
      category: data.category,
      assignmentGroup: data.assignmentGroup || data.assignment_group,
      status: data.status || 'new',
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
      externalId: data.externalId || data.external_id,
      externalUrl: data.externalUrl || data.external_url,
    };
  }

  private buildDescription(alert: Alert): string {
    return `
Device: ${alert.device.hostname} (${alert.device.ipAddress})
Severity: ${alert.severity.toUpperCase()}
Source: ${alert.sourceType}
Time: ${alert.timestamp.toISOString()}

Explanation:
${alert.explanation}

Recommended Actions:
${alert.recommendedActions.map((a, i) => `${i + 1}. ${a.actionDescription}`).join('\n')}

Raw Message:
${alert.rawLog.message}
    `.trim();
  }

  private determineCategory(alert: Alert): string {
    if (alert.sourceType === 'snmp_trap') return 'Network';
    if (alert.sourceType === 'syslog') return 'System';
    return 'Infrastructure';
  }
}

export const incidentFactory = IncidentFactory.getInstance();
