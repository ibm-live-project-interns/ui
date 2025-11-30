import type { Alert, AlertFilters, AlertStatus, PaginatedAlerts } from '../../models';

export interface IAlertService {
  fetchAlerts(filters?: AlertFilters): Promise<Alert[]>;
  fetchAlertsPaginated(page?: number, pageSize?: number, filters?: AlertFilters): Promise<PaginatedAlerts>;
  fetchAlertById(id: string): Promise<Alert | null>;
  updateAlertStatus(id: string, status: AlertStatus): Promise<Alert | null>;
}
