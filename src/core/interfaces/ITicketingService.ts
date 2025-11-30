import type { Alert } from '../../models';
import type { CreateIncidentResponse, Incident } from '../../services/TicketingService';

export interface ITicketingService {
  isEnabled(): boolean;
  createIncidentFromAlert(alert: Alert): Promise<CreateIncidentResponse>;
  getIncidentByAlertId(alertId: string): Promise<Incident | null>;
}
