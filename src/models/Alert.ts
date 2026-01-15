/**
 * Mockup Notice
 * -------------
 * This file is a temporary, human-readable model used to shape the UI and API contracts.
 * It will be updated and refined as real data and backend schemas become available.
 *
 * Reference context (for clarity, not strict contracts):
 * - Alert sources: SNMP traps and Syslog events
 * - AI Processing outputs: explanations, recommended actions, enrichment via RAG (MIBs, vendor docs, past alerts, runbooks)
 * - Ingestion: Raw logs from an ingestor (including OIDs for SNMP and facilities for Syslog)
 * - Status lifecycle: active → acknowledged → resolved/dismissed
 *
 * Notes:
 * - Field names are chosen for clarity and consistency with expected backend terms.
 * - Optional fields may be absent depending on source or processing step.
 * - Types and interfaces serve as a baseline; expect changes as integrations mature.
 */

/**
 * Alert severity levels matching backend classification
 * @see docs/arch/AIProcessing/Class.puml
 */
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Alert status types
 */
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

/**
 * Source type for alerts (SNMP trap or Syslog)
 */
export type AlertSourceType = 'snmp_trap' | 'syslog';

/**
 * Recommended action from Rule Engine
 * @see docs/arch/AIProcessing/Class.puml - RecommendedAction class
 */
export interface RecommendedAction {
  id: string;
  actionDescription: string;
  priority?: number;
  automatable?: boolean;
}

/**
 * Knowledge entry from RAG Connector
 * @see docs/arch/AIProcessing/Class.puml - KnowledgeEntry class
 * @see docs/arch/AIProcessing/Sequence.puml - RAG returns MIB, vendor docs, past alerts
 */
export interface KnowledgeEntry {
  id: string;
  content: string;
  sourceType: 'mib' | 'vendor_doc' | 'past_alert' | 'runbook';
  relevanceScore?: number;
}

/**
 * Device information for alert source
 */
export interface DeviceInfo {
  id: string;
  hostname: string;
  ipAddress: string;
  deviceType?: string;
  vendor?: string;
  location?: string;
}

/**
 * Raw log data from Ingestor
 */
export interface RawLog {
  timestamp: string;
  message: string;
  oid?: string; // For SNMP traps
  facility?: string; // For syslogs
  rawData?: Record<string, unknown>;
}

/**
 * Alert model interface - ProcessedOutput from AI Processing Layer
 * @see docs/arch/Output&Integration/Class.puml - Alert class
 * @see docs/arch/AIProcessing/Class.puml - ProcessedOutput class
 */
export interface Alert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  explanation: string; // LLM-generated explanation
  recommendedActions: RecommendedAction[];
  // Source information
  sourceType: AlertSourceType;
  device: DeviceInfo;
  rawLog: RawLog;
  // Timestamps
  timestamp: Date;
  processedAt: Date;
  // Optional enrichment data
  knowledgeEntries?: KnowledgeEntry[];
  metadata?: Record<string, unknown>;
}

/**
 * Alert summary for dashboard/list views
 */
export interface AlertSummary {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  explanationSnippet: string; // Truncated explanation
  deviceHostname: string;
  sourceType: AlertSourceType;
  timestamp: Date;
}

/**
 * Severity distribution for dashboard charts
 */
export interface SeverityDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

/**
 * Alert filters for querying
 */
export interface AlertFilters {
  severity?: AlertSeverity[];
  status?: AlertStatus[];
  sourceType?: AlertSourceType[];
  deviceId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * Paginated response for alerts
 */
export interface PaginatedAlerts {
  alerts: Alert[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Carbon Tag types for severity
 */
export type SeverityTagKind = 'red' | 'magenta' | 'purple' | 'blue' | 'cyan' | 'teal' | 'green' | 'gray';

/**
 * Formatted alert for display in UI components
 */
export interface FormattedAlert {
  id: string;
  severity: AlertSeverity;
  severityLabel: string;
  severityKind: SeverityTagKind;
  status: AlertStatus;
  statusLabel: string;
  explanation: string;
  explanationSnippet: string;
  recommendedActions: RecommendedAction[];
  device: {
    hostname: string;
    ipAddress: string;
    type?: string;
  };
  sourceType: AlertSourceType;
  sourceTypeLabel: string;
  rawMessage: string;
  formattedTime: string;
  relativeTime: string;
}
