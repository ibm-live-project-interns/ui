import type { Alert, AlertFilters } from '../../models/Alert';

/**
 * IDataStrategy - Strategy interface for data fetching
 * Allows switching between different data sources (API, Mock, Cache, etc.)
 */
export interface IDataStrategy {
  /**
   * Fetch all alerts
   */
  fetchAlerts(filters?: AlertFilters): Promise<Alert[]>;

  /**
   * Fetch single alert by ID
   */
  fetchAlertById(id: string): Promise<Alert | null>;

  /**
   * Update alert status
   */
  updateAlertStatus(id: string, status: string): Promise<Alert | null>;
}
