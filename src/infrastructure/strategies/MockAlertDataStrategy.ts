import type { Alert, AlertFilters } from '../../models/Alert';
import type { IDataStrategy } from './IDataStrategy';
import { MOCK_ALERTS } from '../../__mocks__/alerts.mock';
import { alertFilterService } from '../../domain/services';

/**
 * MockAlertDataStrategy - Uses mock data for development
 */
export class MockAlertDataStrategy implements IDataStrategy {
  async fetchAlerts(filters?: AlertFilters): Promise<Alert[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let alerts = [...MOCK_ALERTS];
    
    if (filters) {
      alerts = alertFilterService.filter(alerts, filters);
    }
    
    return alerts;
  }

  async fetchAlertById(id: string): Promise<Alert | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return MOCK_ALERTS.find(alert => alert.id === id) || null;
  }

  async updateAlertStatus(id: string, status: string): Promise<Alert | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const alert = MOCK_ALERTS.find(a => a.id === id);
    if (alert) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alert.status = status as any;
    }
    return alert || null;
  }
}
