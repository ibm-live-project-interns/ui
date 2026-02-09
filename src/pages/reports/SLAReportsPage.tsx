/**
 * Copyright IBM Corp. 2026
 *
 * SLA Compliance Reports Page
 * Displays SLA metrics, compliance trends, severity breakdown, and violation details.
 * Fetches real data from the /api/v1/reports/sla endpoints.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tile,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableExpandRow,
  TableExpandedRow,
  TableExpandHeader,
  Pagination,
  Tag,
  Button,
  Dropdown,
  SkeletonText,
  SkeletonPlaceholder,
  DataTableSkeleton,
  ProgressBar,
} from '@carbon/react';
import {
  Download,
  Checkmark,
  WarningAlt,
  Time,
  Timer,
} from '@carbon/icons-react';
import { LineChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import '@carbon/charts-react/styles.css';

// Reusable components
import { KPICard, PageHeader } from '@/components';
import type { KPICardProps, KPISeverity } from '@/components/ui/KPICard';
import ChartWrapper from '@/components/ui/ChartWrapper';

// API client
import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';

// Constants
import { getSeverityTag, SEVERITY_CONFIG } from '@/shared/constants/severity';
import type { Severity } from '@/shared/types/common.types';

// Styles
import '@/styles/pages/_sla-reports.scss';

// ==========================================
// Types
// ==========================================

interface SLAOverview {
  compliance_percent: number;
  mttr_minutes: number;
  mttr_display: string;
  mtta_minutes: number;
  mtta_display: string;
  total_violations: number;
  total_alerts: number;
  resolved_count: number;
  period: string;
  by_severity: SeverityBreakdown[];
}

interface SeverityBreakdown {
  severity: string;
  sla_target: string;
  total: number;
  met: number;
  violated: number;
  compliance_percent: number;
}

interface SLAViolation {
  alert_id: string;
  title: string;
  severity: string;
  device: string;
  source_ip: string;
  category: string;
  timestamp: string;
  resolved_at: string;
  expected_minutes: number;
  expected_display: string;
  actual_minutes: number;
  actual_display: string;
  excess_minutes: number;
  excess_display: string;
  description: string;
  ai_summary: string;
  resolved_by: string;
}

interface SLATrendPoint {
  date: string;
  compliance_percent: number;
  met: number;
  violated: number;
  total: number;
}

interface SLAViolationsResponse {
  violations: SLAViolation[];
  total: number;
  period: string;
}

interface SLATrendResponse {
  trend: SLATrendPoint[];
  period: string;
}

// ==========================================
// SLA API Service (local to this page)
// ==========================================

class SLAService extends HttpService {
  constructor() {
    const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
    const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
    super(apiPath, 'SLA');
  }

  async getOverview(period: string): Promise<SLAOverview> {
    return this.request<SLAOverview>(`/reports/sla?period=${period}`);
  }

  async getViolations(period: string): Promise<SLAViolationsResponse> {
    return this.request<SLAViolationsResponse>(`/reports/sla/violations?period=${period}`);
  }

  async getTrend(period: string): Promise<SLATrendResponse> {
    return this.request<SLATrendResponse>(`/reports/sla/trend?period=${period}`);
  }
}

const slaService = new SLAService();

// ==========================================
// Time period options (subset relevant for SLA)
// ==========================================

const SLA_PERIOD_OPTIONS = [
  { id: '7d', text: 'Last 7 Days' },
  { id: '30d', text: 'Last 30 Days' },
  { id: '90d', text: 'Last 90 Days' },
];

// ==========================================
// SLA Compliance Target
// ==========================================

const SLA_TARGET_PERCENT = 99.9;

// ==========================================
// Component
// ==========================================

export function SLAReportsPage() {
  const navigate = useNavigate();

  // State
  const [selectedPeriod, setSelectedPeriod] = useState(SLA_PERIOD_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('g100');

  // Data state
  const [overview, setOverview] = useState<SLAOverview | null>(null);
  const [violations, setViolations] = useState<SLAViolation[]>([]);
  const [trend, setTrend] = useState<SLATrendPoint[]>([]);

  // Violations table pagination
  const [violationsPage, setViolationsPage] = useState(1);
  const [violationsPageSize, setViolationsPageSize] = useState(10);

  // Detect theme (matches TrendsPage pattern)
  useEffect(() => {
    const detectTheme = () => {
      const themeSetting = document.documentElement.getAttribute('data-theme-setting');
      if (themeSetting === 'light') {
        setCurrentTheme('white');
      } else if (themeSetting === 'dark') {
        setCurrentTheme('g100');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setCurrentTheme(prefersDark ? 'g100' : 'white');
      }
    };

    detectTheme();
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-setting'],
    });

    return () => observer.disconnect();
  }, []);

  // Fetch data with mounted guard to prevent state updates after unmount
  useEffect(() => {
    let isMounted = true;

    const doFetch = async () => {
      setIsLoading(true);
      try {
        const period = selectedPeriod.id;
        const [overviewData, violationsData, trendData] = await Promise.all([
          slaService.getOverview(period),
          slaService.getViolations(period),
          slaService.getTrend(period),
        ]);

        if (isMounted) {
          setOverview(overviewData);
          setViolations(violationsData?.violations || []);
          setTrend(trendData?.trend || []);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch SLA data:', error);
          setOverview(null);
          setViolations([]);
          setTrend([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    doFetch();
    const interval = setInterval(doFetch, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedPeriod]);

  // Export handler
  const handleExport = () => {
    if (!overview) return;

    // Build CSV
    const lines: string[] = [];
    lines.push('SLA Compliance Report');
    lines.push(`Period: ${selectedPeriod.text}`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('Overall Metrics');
    lines.push(`Compliance %,${overview.compliance_percent}`);
    lines.push(`MTTR,${overview.mttr_display}`);
    lines.push(`MTTA,${overview.mtta_display}`);
    lines.push(`Total Violations,${overview.total_violations}`);
    lines.push(`Total Alerts,${overview.total_alerts}`);
    lines.push(`Resolved Count,${overview.resolved_count}`);
    lines.push('');

    // Severity breakdown
    lines.push('Compliance by Severity');
    lines.push('Severity,SLA Target,Met,Violated,Compliance %');
    (overview.by_severity || []).forEach((s) => {
      lines.push(`${s.severity},${s.sla_target},${s.met},${s.violated},${s.compliance_percent}`);
    });
    lines.push('');

    // Violations detail
    if (violations.length > 0) {
      lines.push('SLA Violations');
      lines.push('Alert ID,Severity,Device,Expected Time,Actual Time,Excess Time');
      violations.forEach((v) => {
        lines.push(
          `${v.alert_id},${v.severity},${v.device},${v.expected_display},${v.actual_display},${v.excess_display}`
        );
      });
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sla-report-${selectedPeriod.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build KPI cards
  const kpiCards: KPICardProps[] = useMemo(() => {
    if (!overview) return [];

    const complianceSeverity: KPISeverity =
      overview.compliance_percent >= 99.9
        ? 'success'
        : overview.compliance_percent >= 95
          ? 'minor'
          : overview.compliance_percent >= 90
            ? 'major'
            : 'critical';

    const complianceTrend = overview.compliance_percent >= SLA_TARGET_PERCENT
      ? { direction: 'up' as const, value: 'On target', isPositive: true }
      : { direction: 'down' as const, value: `${(SLA_TARGET_PERCENT - overview.compliance_percent).toFixed(1)}% below target`, isPositive: false };

    const violationsSeverity: KPISeverity =
      overview.total_violations === 0
        ? 'success'
        : overview.total_violations <= 5
          ? 'minor'
          : overview.total_violations <= 20
            ? 'major'
            : 'critical';

    return [
      {
        id: 'sla-compliance',
        label: 'SLA Compliance',
        value: `${overview.compliance_percent}%`,
        subtitle: `${overview.resolved_count} resolved of ${overview.total_alerts} total`,
        icon: Checkmark,
        iconColor: complianceSeverity === 'success' ? '#24a148' : complianceSeverity === 'critical' ? '#da1e28' : '#f1c21b',
        severity: complianceSeverity,
        trend: complianceTrend,
      },
      {
        id: 'mttr',
        label: 'Mean Time to Resolve',
        value: overview.mttr_display,
        subtitle: `${overview.mttr_minutes.toFixed(1)} minutes average`,
        icon: Time,
        iconColor: '#0f62fe',
        severity: 'info' as KPISeverity,
        trend: overview.mttr_minutes <= 30
          ? { direction: 'down' as const, value: 'Healthy', isPositive: true }
          : { direction: 'up' as const, value: 'Above target', isPositive: false },
      },
      {
        id: 'mtta',
        label: 'Mean Time to Acknowledge',
        value: overview.mtta_display,
        subtitle: `${overview.mtta_minutes.toFixed(1)} minutes average`,
        icon: Timer,
        iconColor: '#8a3ffc',
        severity: 'info' as KPISeverity,
      },
      {
        id: 'total-violations',
        label: 'Total SLA Violations',
        value: overview.total_violations,
        subtitle: `Across ${overview.total_alerts} alerts in period`,
        icon: WarningAlt,
        iconColor: overview.total_violations > 0 ? '#da1e28' : '#24a148',
        severity: violationsSeverity,
        trend: overview.total_violations === 0
          ? { direction: 'stable' as const, value: 'No violations', isPositive: true }
          : { direction: 'up' as const, value: `${overview.total_violations} breached`, isPositive: false },
      },
    ];
  }, [overview]);

  // Build chart data for trend line
  const trendChartData = useMemo(() => {
    if (!trend || trend.length === 0) return [];

    const compliancePoints = trend.map((point) => ({
      group: 'SLA Compliance',
      date: new Date(point.date),
      value: point.compliance_percent,
    }));

    // Add target line
    const targetPoints = trend.map((point) => ({
      group: 'Target (99.9%)',
      date: new Date(point.date),
      value: SLA_TARGET_PERCENT,
    }));

    return [...compliancePoints, ...targetPoints];
  }, [trend]);

  // Chart options
  const lineChartOptions = useMemo(
    () => ({
      axes: {
        left: {
          title: 'Compliance %',
          mapsTo: 'value',
          includeZero: false,
          domain: [
            Math.max(0, Math.min(...(trend.map((t) => t.compliance_percent).filter((v) => v > 0))) - 5),
            100,
          ],
        },
        bottom: {
          title: 'Date',
          mapsTo: 'date',
          scaleType: ScaleTypes.TIME,
        },
      },
      height: '100%',
      curve: 'curveMonotoneX' as const,
      theme: currentTheme,
      toolbar: { enabled: false },
      legend: { alignment: 'center' as const, position: 'top' as const },
      points: { enabled: true, radius: 3 },
      color: {
        scale: {
          'SLA Compliance': '#0f62fe',
          'Target (99.9%)': '#da1e28',
        },
      },
    }),
    [currentTheme, trend]
  );

  // Severity table data
  const severityTableHeaders = [
    { key: 'severity', header: 'Severity' },
    { key: 'sla_target', header: 'SLA Target' },
    { key: 'met', header: 'Met' },
    { key: 'violated', header: 'Violated' },
    { key: 'compliance', header: 'Compliance %' },
  ];

  const severityTableRows = useMemo(() => {
    if (!overview?.by_severity) return [];
    return overview.by_severity
      .filter((s) => s.total > 0)
      .map((s) => ({
        id: s.severity,
        severity: s.severity,
        sla_target: s.sla_target,
        met: s.met,
        violated: s.violated,
        compliance: s.compliance_percent,
      }));
  }, [overview]);

  // Violations table
  const violationHeaders = [
    { key: 'alert_id', header: 'Alert ID' },
    { key: 'severity', header: 'Severity' },
    { key: 'device', header: 'Device' },
    { key: 'expected', header: 'Expected Time' },
    { key: 'actual', header: 'Actual Time' },
    { key: 'excess', header: 'Excess' },
  ];

  const paginatedViolations = useMemo(() => {
    const start = (violationsPage - 1) * violationsPageSize;
    return violations.slice(start, start + violationsPageSize);
  }, [violations, violationsPage, violationsPageSize]);

  const violationTableRows = useMemo(() => {
    return paginatedViolations.map((v) => ({
      id: v.alert_id,
      alert_id: v.alert_id,
      severity: v.severity,
      device: v.device,
      expected: v.expected_display,
      actual: v.actual_display,
      excess: v.excess_display,
    }));
  }, [paginatedViolations]);

  // Get compliance bar color
  const getComplianceColor = (percent: number): string => {
    if (percent >= 99.9) return '#24a148';
    if (percent >= 95) return '#f1c21b';
    if (percent >= 90) return '#ff832b';
    return '#da1e28';
  };

  // Loading skeleton
  if (isLoading && !overview) {
    return (
      <div className="sla-reports-page">
        <PageHeader
          title="SLA Compliance Reports"
          subtitle="Loading SLA data..."
          showBreadcrumbs={false}
          showBorder
        />
        <div className="kpi-row">
          {[1, 2, 3, 4].map((i) => (
            <Tile key={i}>
              <SkeletonText width="60%" />
              <SkeletonText heading width="40%" />
              <SkeletonText width="80%" />
            </Tile>
          ))}
        </div>
        <Tile style={{ marginTop: '1.5rem' }}>
          <SkeletonPlaceholder style={{ width: '100%', height: '400px' }} />
        </Tile>
        <DataTableSkeleton
          columnCount={5}
          rowCount={5}
          showHeader
          showToolbar={false}
          style={{ marginTop: '1.5rem' }}
        />
      </div>
    );
  }

  // Empty state
  const isEmpty = !overview || (overview.total_alerts === 0 && violations.length === 0 && trend.length === 0);

  if (!isLoading && isEmpty) {
    return (
      <div className="sla-reports-page">
        <PageHeader
          title="SLA Compliance Reports"
          subtitle="Service level agreement compliance tracking and analysis"
          showBreadcrumbs={false}
          showBorder
          rightContent={
            <Dropdown
              id="sla-period-dropdown"
              titleText=""
              label="Select Period"
              items={SLA_PERIOD_OPTIONS}
              itemToString={(item) => item?.text || ''}
              selectedItem={selectedPeriod}
              onChange={({ selectedItem }) =>
                setSelectedPeriod(selectedItem || SLA_PERIOD_OPTIONS[0])
              }
              size="md"
            />
          }
        />
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--cds-text-secondary)' }}>
          <WarningAlt size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No SLA data available</h3>
          <p>No alert data was found for the selected period. SLA metrics require resolved alerts to compute compliance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sla-reports-page" style={{ padding: '0 2rem 2rem' }}>
      {/* Page Header */}
      <PageHeader
        title="SLA Compliance Reports"
        subtitle="Service level agreement compliance tracking and analysis"
        showBreadcrumbs={false}
        showBorder
        rightContent={
          <Dropdown
            id="sla-period-dropdown"
            titleText=""
            label="Select Period"
            items={SLA_PERIOD_OPTIONS}
            itemToString={(item) => item?.text || ''}
            selectedItem={selectedPeriod}
            onChange={({ selectedItem }) =>
              setSelectedPeriod(selectedItem || SLA_PERIOD_OPTIONS[0])
            }
            size="md"
          />
        }
        actions={[
          {
            label: 'Export Report',
            onClick: handleExport,
            variant: 'primary',
            icon: Download,
          },
        ]}
      />

      {/* KPI Row */}
      <div className="kpi-row">
        {kpiCards.map((kpi) => (
          <KPICard key={kpi.id} {...kpi} />
        ))}
      </div>

      {/* SLA Compliance Trend Chart */}
      <Tile style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--cds-text-primary)' }}>
            SLA Compliance Trend
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Daily compliance percentage with {SLA_TARGET_PERCENT}% target line
          </p>
        </div>
        <div style={{ height: '400px' }}>
          <ChartWrapper
            ChartComponent={LineChart}
            data={trendChartData}
            options={lineChartOptions}
            height="400px"
            emptyMessage="No trend data available for this period"
          />
        </div>
      </Tile>

      {/* Two-column: Severity Table + Violations Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: '1.5rem',
          marginTop: '1.5rem',
        }}
      >
        {/* SLA by Severity Table */}
        <Tile style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--cds-text-primary)' }}>
              Compliance by Severity
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
              SLA performance breakdown per severity level
            </p>
          </div>

          <DataTable rows={severityTableRows} headers={severityTableHeaders}>
            {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
              <TableContainer>
                <Table {...getTableProps()} size="lg">
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader {...getHeaderProps({ header })} key={header.key}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const sevData = overview?.by_severity?.find(
                        (s) => s.severity === row.id
                      );
                      if (!sevData) return null;

                      return (
                        <TableRow {...getRowProps({ row })} key={row.id}>
                          <TableCell>
                            {getSeverityTag(sevData.severity as Severity)}
                          </TableCell>
                          <TableCell>
                            <Tag type="gray" size="sm">
                              {sevData.sla_target}
                            </Tag>
                          </TableCell>
                          <TableCell>
                            <span style={{ color: 'var(--cds-support-success)', fontWeight: 600 }}>
                              {sevData.met}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              style={{
                                color: sevData.violated > 0 ? 'var(--cds-support-error)' : 'var(--cds-text-secondary)',
                                fontWeight: sevData.violated > 0 ? 600 : 400,
                              }}
                            >
                              {sevData.violated}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <ProgressBar
                                label={`${sevData.compliance_percent}%`}
                                value={sevData.compliance_percent}
                                max={100}
                                hideLabel
                                size="small"
                                status={
                                  sevData.compliance_percent >= 99.9
                                    ? undefined
                                    : sevData.compliance_percent >= 90
                                      ? undefined
                                      : 'error'
                                }
                              />
                              <span
                                style={{
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  color: getComplianceColor(sevData.compliance_percent),
                                  minWidth: '3.5rem',
                                  textAlign: 'right',
                                }}
                              >
                                {sevData.compliance_percent}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {severityTableRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={severityTableHeaders.length}>
                          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--cds-text-secondary)' }}>
                            No severity data available
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        </Tile>

        {/* Violations Quick Summary */}
        <Tile style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--cds-text-primary)' }}>
              Violations Summary
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
              {violations.length} SLA violations in the {selectedPeriod.text.toLowerCase()}
            </p>
          </div>

          {violations.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem',
                color: 'var(--cds-text-secondary)',
              }}
            >
              <Checkmark size={48} style={{ color: 'var(--cds-support-success)', marginBottom: '1rem' }} />
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--cds-support-success)' }}>
                All SLAs Met
              </h4>
              <p style={{ fontSize: '0.875rem', textAlign: 'center' }}>
                No SLA violations were recorded during this period. All alerts were resolved within their severity-based SLA thresholds.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Top violation severities */}
              {(() => {
                const bySev: Record<string, number> = {};
                violations.forEach((v) => {
                  bySev[v.severity] = (bySev[v.severity] || 0) + 1;
                });
                const sorted = Object.entries(bySev).sort((a, b) => b[1] - a[1]);
                return sorted.map(([sev, count]) => (
                  <div
                    key={sev}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--cds-layer-02)',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${SEVERITY_CONFIG[sev as Severity]?.color || 'var(--cds-border-subtle)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {getSeverityTag(sev as Severity)}
                      <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-primary)' }}>
                        violations
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--cds-text-primary)',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ));
              })()}

              {/* Worst offender */}
              {violations.length > 0 && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--cds-layer-02)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}
                >
                  <span style={{ color: 'var(--cds-text-secondary)' }}>Longest breach: </span>
                  <span style={{ fontWeight: 600, color: 'var(--cds-support-error)' }}>
                    {violations.reduce((max, v) =>
                      v.excess_minutes > max.excess_minutes ? v : max
                    ).excess_display}
                  </span>
                  <span style={{ color: 'var(--cds-text-secondary)' }}> over SLA on </span>
                  <span style={{ fontWeight: 600, color: 'var(--cds-text-primary)' }}>
                    {violations.reduce((max, v) =>
                      v.excess_minutes > max.excess_minutes ? v : max
                    ).device}
                  </span>
                </div>
              )}
            </div>
          )}
        </Tile>
      </div>

      {/* SLA Violations Table */}
      {violations.length > 0 && (
        <Tile style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--cds-text-primary)' }}>
              SLA Violations Detail
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
              Alerts where resolution time exceeded SLA threshold
            </p>
          </div>

          <DataTable rows={violationTableRows} headers={violationHeaders}>
            {({
              rows,
              headers,
              getTableProps,
              getHeaderProps,
              getRowProps,
              getExpandHeaderProps,
            }) => (
              <TableContainer>
                <Table {...getTableProps()} size="lg">
                  <TableHead>
                    <TableRow>
                      <TableExpandHeader {...getExpandHeaderProps()} />
                      {headers.map((header) => (
                        <TableHeader {...getHeaderProps({ header })} key={header.key}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const violation = paginatedViolations.find(
                        (v) => v.alert_id === row.id
                      );
                      if (!violation) return null;

                      return (
                        <React.Fragment key={row.id}>
                          <TableExpandRow {...getRowProps({ row })}>
                            <TableCell>
                              <Button
                                kind="ghost"
                                size="sm"
                                onClick={() => navigate(`/alerts/${violation.alert_id}`)}
                                style={{ padding: 0, textDecoration: 'underline' }}
                              >
                                {violation.alert_id}
                              </Button>
                            </TableCell>
                            <TableCell>
                              {getSeverityTag(violation.severity as Severity)}
                            </TableCell>
                            <TableCell>
                              <span style={{ fontSize: '0.875rem' }}>{violation.device}</span>
                            </TableCell>
                            <TableCell>
                              <Tag type="gray" size="sm">
                                {violation.expected_display}
                              </Tag>
                            </TableCell>
                            <TableCell>
                              <span style={{ color: 'var(--cds-support-error)', fontWeight: 600 }}>
                                {violation.actual_display}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Tag type="red" size="sm">
                                +{violation.excess_display}
                              </Tag>
                            </TableCell>
                          </TableExpandRow>

                          <TableExpandedRow colSpan={violationHeaders.length + 1}>
                            <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>
                                  Title
                                </div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                  {violation.title}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>
                                  Category
                                </div>
                                <div style={{ fontSize: '0.875rem' }}>
                                  {violation.category || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>
                                  Description
                                </div>
                                <div style={{ fontSize: '0.875rem' }}>
                                  {violation.description || violation.ai_summary || 'No description available'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>
                                  Resolved By
                                </div>
                                <div style={{ fontSize: '0.875rem' }}>
                                  {violation.resolved_by || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>
                                  Alert Timestamp
                                </div>
                                <div style={{ fontSize: '0.875rem' }}>
                                  {violation.timestamp ? new Date(violation.timestamp).toLocaleString() : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>
                                  Resolved At
                                </div>
                                <div style={{ fontSize: '0.875rem' }}>
                                  {violation.resolved_at ? new Date(violation.resolved_at).toLocaleString() : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </TableExpandedRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>

          <Pagination
            totalItems={violations.length}
            pageSize={violationsPageSize}
            pageSizes={[10, 20, 50]}
            page={violationsPage}
            onChange={({ page, pageSize }: { page: number; pageSize: number }) => {
              setViolationsPage(page);
              setViolationsPageSize(pageSize);
            }}
          />
        </Tile>
      )}
    </div>
  );
}

export default SLAReportsPage;
