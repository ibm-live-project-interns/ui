import type { Alert, AlertFilters } from '../../models/Alert';
import type { IDataStrategy } from './IDataStrategy';
import { alertFactory } from '../../domain/factories';

/**
 * ApiAlertDataStrategy - Fetches data from real API
 */
export class ApiAlertDataStrategy implements IDataStrategy {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return response.json();
  }

  async fetchAlerts(filters?: AlertFilters): Promise<Alert[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = filters ? `?${new URLSearchParams(filters as any)}` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.request<any[]>(`/alerts${params}`);
    return data.map(alertFactory.createFromApiResponse);
  }

  async fetchAlertById(id: string): Promise<Alert | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await this.request<any>(`/alerts/${id}`);
      return alertFactory.createFromApiResponse(data);
    } catch {
      return null;
    }
  }

  async updateAlertStatus(id: string, status: string): Promise<Alert | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await this.request<any>(`/alerts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return alertFactory.createFromApiResponse(data);
    } catch {
      return null;
    }
  }
}

