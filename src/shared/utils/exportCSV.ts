/**
 * Copyright IBM Corp. 2026
 *
 * exportCSV Utility
 * Downloads a CSV report from the backend /reports/export endpoint.
 * Replaces duplicated blob-download logic in PriorityAlertsPage, TicketsPage, etc.
 */

import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';

/**
 * Export a CSV report from the backend.
 *
 * @param type - Report type (e.g. 'alerts', 'tickets', 'sla', 'incidents', 'device-health')
 * @param filters - Optional additional query parameters (e.g. { severity: 'critical' })
 */
export async function exportCSV(
  type: string,
  filters?: Record<string, string>
): Promise<void> {
  const params = new URLSearchParams({ type, format: 'csv', ...filters });
  const url = `${API_BASE_URL}/api/v1${API_ENDPOINTS.REPORTS_EXPORT}?${params}`;

  const token = localStorage.getItem('noc_token');
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}
