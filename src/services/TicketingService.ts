/**
 * TicketingService - Integration with ServiceNow and other ticketing systems
 *
 * @architecture docs/arch/Output&Integration/Component.puml
 * "[Ticketing Connector (ServiceNow)] as TicketingConnector"
 * "AgentsAPI --> TicketingConnector : Send incident creation (future use)"
 *
 * @see docs/arch/Output&Integration/Class.puml
 * "class TicketingConnector { +createIncident(alert: Alert) }"
 */

import { HttpService } from './HttpService';
import { env } from '../config/environment';
import { incidentFactory } from '../domain/factories';
import type { Alert } from '../models';

/**
 * Incident ticket model for ticketing systems
 */
export interface Incident {
  id?: string;
  alertId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  assignmentGroup?: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  createdAt?: Date;
  updatedAt?: Date;
  externalId?: string; // ServiceNow sys_id
  externalUrl?: string; // Link to ticket in external system
}

/**
 * Request to create an incident
 */
export interface CreateIncidentRequest {
  alertId: string;
  title: string;
  description: string;
  severity: string;
  category?: string;
  assignmentGroup?: string;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Response from creating an incident
 */
export interface CreateIncidentResponse {
  success: boolean;
  incident?: Incident;
  error?: string;
}

/**
 * TicketingService - Handles incident creation and management
 * Integrates with ServiceNow via Agents-api ticketing connector
 *
 * @see docs/arch/Output&Integration/Sequence.puml
 * "alt Automated ticketing: AgentsAPI -> TicketingSystem: Create incident"
 */
export class TicketingService extends HttpService {
  private static instance: TicketingService;

  private constructor() {
    super('/api/v1/ticketing');
  }

  public static getInstance(): TicketingService {
    if (!TicketingService.instance) {
      TicketingService.instance = new TicketingService();
    }
    return TicketingService.instance;
  }

  /**
   * Check if ticketing integration is enabled
   */
  public isEnabled(): boolean {
    return env.ticketingEnabled && env.ticketingProvider !== 'none';
  }

  /**
   * Get current ticketing provider
   */
  public getProvider(): string {
    return env.ticketingProvider;
  }

  /**
   * Create incident from alert
   * @see docs/arch/Output&Integration/Class.puml - TicketingConnector.createIncident()
   */
  public async createIncidentFromAlert(alert: Alert): Promise<CreateIncidentResponse> {
    if (!this.isEnabled()) {
      return {
        success: false,
        error: 'Ticketing integration is not enabled',
      };
    }

    // Use factory to create incident request
    const request = incidentFactory.createRequestFromAlert(alert);

    // Production: return this.post<CreateIncidentResponse>('/incidents', request);

    // Mock response for development
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      incident: {
        id: `INC${Date.now()}`,
        alertId: alert.id,
        title: request.title,
        description: request.description,
        severity: request.severity as 'critical' | 'high' | 'medium' | 'low',
        category: request.category || 'Network',
        status: 'new',
        createdAt: new Date(),
        externalId: `SN${Date.now()}`,
        externalUrl: `https://example.service-now.com/incident.do?sys_id=SN${Date.now()}`,
      },
    };
  }

  /**
   * Get incident by alert ID
   */
  public async getIncidentByAlertId(_alertId: string): Promise<Incident | null> {
    // Production: return this.get<Incident>(`/incidents/by-alert/${alertId}`);

    // Mock: No existing incident
    await new Promise(resolve => setTimeout(resolve, 200));
    return null;
  }

  /**
   * Get all incidents for alerts
   */
  public async getIncidents(_alertIds?: string[]): Promise<Incident[]> {
    // Production: return this.get<Incident[]>('/incidents', { params: { alertIds } });

    await new Promise(resolve => setTimeout(resolve, 200));
    return [];
  }
}

export const ticketingService = TicketingService.getInstance();
