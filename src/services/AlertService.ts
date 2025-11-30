import { HttpService } from './HttpService';
import { alertFactory } from '../domain/factories';
import { alertAggregationService, paginationService } from '../domain/services';
import { MockAlertDataStrategy, ApiAlertDataStrategy } from '../infrastructure/strategies';
import type { IDataStrategy } from '../infrastructure/strategies';
import type {
  Alert,
  AlertSummary,
  AlertStatus,
  AlertFilters,
  PaginatedAlerts,
  SeverityDistribution,
} from '../models';

export class AlertService extends HttpService {
  private static instance: AlertService;
  private dataStrategy: IDataStrategy;

  private constructor() {
    super('/api/v1');
    // Use mock strategy by default (can be changed via setStrategy)
    this.dataStrategy = new MockAlertDataStrategy();
  }

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  /**
   * Set data fetching strategy
   */
  public setStrategy(strategy: IDataStrategy): void {
    this.dataStrategy = strategy;
  }

  /**
   * Switch to API strategy
   */
  public useApiStrategy(): void {
    this.dataStrategy = new ApiAlertDataStrategy();
  }

  /**
   * Switch to Mock strategy
   */
  public useMockStrategy(): void {
    this.dataStrategy = new MockAlertDataStrategy();
  }

  async fetchAlerts(filters?: AlertFilters): Promise<Alert[]> {
    return this.dataStrategy.fetchAlerts(filters);
  }

  async fetchAlertsPaginated(page: number = 1, pageSize: number = 10, filters?: AlertFilters): Promise<PaginatedAlerts> {
    const allAlerts = await this.fetchAlerts(filters);
    
    // Use domain service for pagination
    const paginated = paginationService.paginate(allAlerts, page, pageSize);
    
    return {
      alerts: paginated.items,
      total: paginated.total,
      page: paginated.page,
      pageSize: paginated.pageSize,
      totalPages: paginated.totalPages,
    };
  }

  async fetchAlertById(id: string): Promise<Alert | null> {
    return this.dataStrategy.fetchAlertById(id);
  }

  async fetchAlertSummaries(filters?: AlertFilters): Promise<AlertSummary[]> {
    const alerts = await this.fetchAlerts(filters);
    // Use factory for creating summaries
    return alerts.map(alert => alertFactory.createSummary(alert));
  }

  async getSeverityDistribution(): Promise<SeverityDistribution> {
    const alerts = await this.fetchAlerts();
    // Use domain service for aggregation
    return alertAggregationService.getSeverityDistribution(alerts);
  }

  async updateAlertStatus(id: string, status: AlertStatus): Promise<Alert | null> {
    return this.dataStrategy.updateAlertStatus(id, status);
  }
}

export const alertService = AlertService.getInstance();
