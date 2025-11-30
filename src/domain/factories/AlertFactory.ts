import type { Alert, AlertSummary } from '../../models/Alert';

/**
 * Factory for creating Alert domain objects
 * Centralizes Alert creation logic and provides defaults
 */
export class AlertFactory {
  private static instance: AlertFactory;

  private constructor() {}

  static getInstance(): AlertFactory {
    if (!AlertFactory.instance) {
      AlertFactory.instance = new AlertFactory();
    }
    return AlertFactory.instance;
  }

  /**
   * Create Alert from API response data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createFromApiResponse(data: any): Alert {
    return {
      id: data.id,
      severity: data.severity,
      status: data.status || 'active',
      explanation: data.explanation || '',
      recommendedActions: data.recommendedActions || data.recommended_actions || [],
      sourceType: data.sourceType || data.source_type,
      device: {
        id: data.device?.id || data.device_id,
        hostname: data.device?.hostname || data.hostname || 'Unknown',
        ipAddress: data.device?.ipAddress || data.device?.ip_address || data.ip_address || '',
        deviceType: data.device?.deviceType || data.device?.device_type,
        vendor: data.device?.vendor,
        location: data.device?.location,
      },
      rawLog: {
        timestamp: data.rawLog?.timestamp || data.raw_log?.timestamp || data.timestamp,
        message: data.rawLog?.message || data.raw_log?.message || data.message || '',
        oid: data.rawLog?.oid || data.raw_log?.oid,
        facility: data.rawLog?.facility || data.raw_log?.facility,
        rawData: data.rawLog?.rawData || data.raw_log?.raw_data,
      },
      timestamp: new Date(data.timestamp),
      processedAt: new Date(data.processedAt || data.processed_at || data.timestamp),
      knowledgeEntries: data.knowledgeEntries || data.knowledge_entries,
      metadata: data.metadata,
    };
  }

  /**
   * Create AlertSummary from full Alert
   */
  createSummary(alert: Alert): AlertSummary {
    return {
      id: alert.id,
      severity: alert.severity,
      status: alert.status,
      explanationSnippet: alert.explanation.substring(0, 100) + (alert.explanation.length > 100 ? '...' : ''),
      deviceHostname: alert.device.hostname,
      sourceType: alert.sourceType,
      timestamp: alert.timestamp,
    };
  }
}

export const alertFactory = AlertFactory.getInstance();
