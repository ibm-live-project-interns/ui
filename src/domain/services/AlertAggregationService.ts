import type { Alert, SeverityDistribution } from '../../models/Alert';

/**
 * AlertAggregationService - Domain service for alert data aggregation
 * Encapsulates aggregation and statistics logic
 */
export class AlertAggregationService {
  private static instance: AlertAggregationService;

  private constructor() {}

  static getInstance(): AlertAggregationService {
    if (!AlertAggregationService.instance) {
      AlertAggregationService.instance = new AlertAggregationService();
    }
    return AlertAggregationService.instance;
  }

  /**
   * Calculate severity distribution
   */
  getSeverityDistribution(alerts: Alert[]): SeverityDistribution {
    return alerts.reduce(
      (dist, alert) => {
        dist[alert.severity]++;
        return dist;
      },
      { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as SeverityDistribution
    );
  }

  /**
   * Get count by status
   */
  getStatusCounts(alerts: Alert[]): Record<string, number> {
    return alerts.reduce((counts, alert) => {
      counts[alert.status] = (counts[alert.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  /**
   * Get count by source type
   */
  getSourceTypeCounts(alerts: Alert[]): Record<string, number> {
    return alerts.reduce((counts, alert) => {
      counts[alert.sourceType] = (counts[alert.sourceType] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }
}

export const alertAggregationService = AlertAggregationService.getInstance();
