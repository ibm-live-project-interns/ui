import type { Alert, AlertFilters } from '../../models/Alert';

/**
 * AlertFilterService - Domain service for filtering alerts
 * Encapsulates filtering business logic
 */
export class AlertFilterService {
  private static instance: AlertFilterService;

  private constructor() {}

  static getInstance(): AlertFilterService {
    if (!AlertFilterService.instance) {
      AlertFilterService.instance = new AlertFilterService();
    }
    return AlertFilterService.instance;
  }

  /**
   * Filter alerts based on criteria
   */
  filter(alerts: Alert[], filters: AlertFilters): Alert[] {
    let filtered = [...alerts];

    if (filters.severity?.length) {
      filtered = filtered.filter(a => filters.severity!.includes(a.severity));
    }

    if (filters.status?.length) {
      filtered = filtered.filter(a => filters.status!.includes(a.status));
    }

    if (filters.sourceType?.length) {
      filtered = filtered.filter(a => filters.sourceType!.includes(a.sourceType));
    }

    if (filters.deviceId) {
      filtered = filtered.filter(a => a.device.id === filters.deviceId);
    }

    if (filters.startDate) {
      filtered = filtered.filter(a => a.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(a => a.timestamp <= filters.endDate!);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(a =>
        a.explanation.toLowerCase().includes(searchLower) ||
        a.device.hostname.toLowerCase().includes(searchLower) ||
        a.device.ipAddress.includes(searchLower)
      );
    }

    return filtered;
  }
}

export const alertFilterService = AlertFilterService.getInstance();
