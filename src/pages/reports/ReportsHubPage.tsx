/**
 * Copyright IBM Corp. 2026
 *
 * Reports Hub Page
 * Centralized hub for generating, downloading, and navigating to all report types.
 * Supports CSV export via /api/v1/reports/export and links to existing report pages.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tile,
  Button,
  InlineLoading,
} from '@carbon/react';
import {
  Document,
  Checkmark,
  WatsonHealthAiResults,
  NetworkEnterprise,
  Download,
  ArrowRight,
  Report,
  Calendar,
  RecentlyViewed,
} from '@carbon/icons-react';

// Reusable components
import { KPICard, PageHeader } from '@/components';

// Config & constants
import { env, API_ENDPOINTS } from '@/shared/config';
import { ROUTES } from '@/shared/constants/routes';

// Toast
import { useToast } from '@/contexts';

// Styles
import '@/styles/pages/_reports-hub.scss';

// ==========================================
// Types
// ==========================================

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  /** 'download' triggers CSV export; 'navigate' links to an existing page */
  action: 'download' | 'navigate';
  /** For download reports: the query param value for /reports/export?type=X */
  exportType?: string;
  /** For navigate reports: the route path */
  navigateTo?: string;
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEY_PREFIX = 'reports_hub_';
const STORAGE_KEY_COUNTER = `${STORAGE_KEY_PREFIX}total_generated`;

const REPORT_TYPES: ReportType[] = [
  {
    id: 'alerts',
    name: 'Alert Report',
    description: 'Export all alerts with severity, status, source, and timestamps. Useful for trend analysis and compliance audits.',
    icon: Document,
    iconColor: '#da1e28',
    action: 'download',
    exportType: 'alerts',
  },
  {
    id: 'tickets',
    name: 'Ticket Report',
    description: 'Export all tickets with priority, assignee, status, and resolution details. Track team workload and response times.',
    icon: Report,
    iconColor: '#0f62fe',
    action: 'download',
    exportType: 'tickets',
  },
  {
    id: 'sla',
    name: 'SLA Compliance Report',
    description: 'View SLA metrics, compliance trends by severity, and violation details with drill-down analysis.',
    icon: Checkmark,
    iconColor: '#198038',
    action: 'navigate',
    navigateTo: ROUTES.SLA_REPORTS,
  },
  {
    id: 'incidents',
    name: 'Incident Summary',
    description: 'Historical analysis of resolved incidents including root causes, resolution times, and post-mortem actions.',
    icon: WatsonHealthAiResults,
    iconColor: '#8a3ffc',
    action: 'navigate',
    navigateTo: ROUTES.INCIDENT_HISTORY,
  },
  {
    id: 'devices',
    name: 'Device Health Report',
    description: 'Device status overview with health metrics, uptime data, and alert counts per device. Identify problem hardware.',
    icon: NetworkEnterprise,
    iconColor: '#005d5d',
    action: 'download',
    exportType: 'devices',
  },
];

// ==========================================
// Helpers
// ==========================================

function getLastGenerated(reportId: string): string | null {
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}last_${reportId}`);
  } catch {
    return null;
  }
}

function setLastGenerated(reportId: string): void {
  try {
    const now = new Date().toISOString();
    localStorage.setItem(`${STORAGE_KEY_PREFIX}last_${reportId}`, now);
  } catch {
    // localStorage may be full or unavailable; silently ignore
  }
}

function getTotalGenerated(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEY_COUNTER);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function incrementTotalGenerated(): number {
  try {
    const next = getTotalGenerated() + 1;
    localStorage.setItem(STORAGE_KEY_COUNTER, String(next));
    return next;
  } catch {
    return 0;
  }
}

function getLastReportDate(): string {
  let latest: Date | null = null;
  for (const report of REPORT_TYPES) {
    const ts = getLastGenerated(report.id);
    if (ts) {
      const d = new Date(ts);
      if (!latest || d > latest) {
        latest = d;
      }
    }
  }
  if (!latest) return 'Never';
  return latest.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==========================================
// Component
// ==========================================

export function ReportsHubPage() {
  const navigate = useNavigate();

  // Track which reports are currently downloading
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  // Toast notifications (via shared ToastProvider)
  const { addToast } = useToast();

  // KPI values (from localStorage)
  const [totalGenerated, setTotalGenerated] = useState(getTotalGenerated);
  const [lastReportDate, setLastReportDate] = useState(getLastReportDate);

  // Force re-render of last-generated timestamps when a download completes
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Download a CSV report via the /api/v1/reports/export endpoint.
   * Fetches a blob, creates an object URL, and triggers browser download.
   */
  const handleDownload = useCallback(async (report: ReportType) => {
    if (!report.exportType) return;

    setDownloading((prev) => ({ ...prev, [report.id]: true }));

    try {
      const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
      const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
      const url = `${apiPath}${API_ENDPOINTS.REPORTS_EXPORT}?type=${report.exportType}`;

      // Get JWT token for authenticated request
      const token = localStorage.getItem('noc_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorMsg = `Server returned ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) errorMsg = errorJson.error;
        } catch {
          if (errorText) errorMsg = errorText;
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger download
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      const timestamp = new Date().toISOString().slice(0, 10);
      anchor.download = `${report.exportType}-report-${timestamp}.csv`;
      document.body.appendChild(anchor);
      anchor.click();

      // Cleanup
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(downloadUrl);

      // Track in localStorage
      setLastGenerated(report.id);
      const newTotal = incrementTotalGenerated();
      setTotalGenerated(newTotal);
      setLastReportDate(getLastReportDate());
      setRefreshKey((k) => k + 1);

      addToast('success', 'Report Downloaded', `${report.name} exported successfully.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      addToast('error', 'Download Failed', `${report.name}: ${message}`);
    } finally {
      setDownloading((prev) => ({ ...prev, [report.id]: false }));
    }
  }, [addToast]);

  const handleNavigate = useCallback((report: ReportType) => {
    if (report.navigateTo) {
      navigate(report.navigateTo);
    }
  }, [navigate]);

  const handleAction = useCallback((report: ReportType) => {
    if (report.action === 'download') {
      handleDownload(report);
    } else {
      handleNavigate(report);
    }
  }, [handleDownload, handleNavigate]);

  return (
    <div className="reports-hub">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Reports', active: true },
        ]}
        title="Reports"
        subtitle="Generate, download, and schedule reports for network monitoring data."
        showBorder
      />

      {/* KPI Row */}
      <div className="reports-hub__kpi-row">
        <KPICard
          label="Total Reports Generated"
          value={totalGenerated}
          icon={Document}
          iconColor="#0f62fe"
          severity="info"
          subtitle="All-time downloads"
        />
        <KPICard
          label="Last Report Date"
          value={lastReportDate}
          icon={Calendar}
          iconColor="#8a3ffc"
          severity="neutral"
          subtitle="Most recent export"
        />
        <KPICard
          label="Available Report Types"
          value={REPORT_TYPES.length}
          icon={RecentlyViewed}
          iconColor="#198038"
          severity="success"
          subtitle="CSV and interactive reports"
        />
      </div>

      {/* Report Cards Grid */}
      <div className="reports-hub__grid">
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon;
          const isDownloading = downloading[report.id] === true;
          const lastGen = getLastGenerated(report.id);

          return (
            <Tile key={`${report.id}-${refreshKey}`} className="reports-hub__card">
              <div className="reports-hub__card-header">
                <span
                  className="reports-hub__card-icon"
                  style={{ color: report.iconColor }}
                >
                  <Icon size={24} />
                </span>
                <div className="reports-hub__card-title-group">
                  <h4 className="reports-hub__card-title">{report.name}</h4>
                  {lastGen && (
                    <span className="reports-hub__card-timestamp">
                      Last generated: {formatTimestamp(lastGen)}
                    </span>
                  )}
                  {!lastGen && (
                    <span className="reports-hub__card-timestamp reports-hub__card-timestamp--never">
                      Never generated
                    </span>
                  )}
                </div>
              </div>

              <p className="reports-hub__card-description">{report.description}</p>

              <div className="reports-hub__card-footer">
                {report.action === 'download' ? (
                  <Button
                    kind="primary"
                    size="md"
                    renderIcon={isDownloading ? undefined : Download}
                    onClick={() => handleAction(report)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <InlineLoading description="Generating..." />
                    ) : (
                      'Generate CSV'
                    )}
                  </Button>
                ) : (
                  <Button
                    kind="tertiary"
                    size="md"
                    renderIcon={ArrowRight}
                    onClick={() => handleAction(report)}
                  >
                    View Report
                  </Button>
                )}
              </div>
            </Tile>
          );
        })}
      </div>

    </div>
  );
}

export default ReportsHubPage;
