import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tile, DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, Button, ProgressBar, SkeletonText, SkeletonPlaceholder, DataTableSkeleton,
  Pagination
} from '@carbon/react';
import {
  Notification, CheckmarkFilled, View, Checkmark, Analytics,
  WarningAlt, WarningAltFilled
} from '@carbon/icons-react';
import ChartWrapper from '@/components/ui/ChartWrapper';
import { StackedAreaChart, DonutChart } from '@carbon/charts-react';
import '@carbon/charts-react/styles.css';
import '@/styles/pages/_dashboard.scss';
import '@/styles/components/_kpi-card.scss';

import { getSeverityTag } from '@/shared/constants/severity';
import { getStatusTag } from '@/shared/constants/status';
import { getDeviceIcon } from '@/shared/constants/devices';
import { createAreaChartOptions, createDonutChartOptions } from '@/shared/constants/charts';
import { alertDataService } from '@/shared/services';
import { normalizeAlert } from '@/shared/utils/normalizeAlert';
import type { SummaryAlert, NoisyDevice, AIMetric } from '@/features/alerts/types/alert.types';
import { NoisyDevicesCard, AlertTicker, KPICard, DataTableWrapper } from '@/components';
import type { CriticalAlert, KPISeverity, NoisyDeviceItem } from '@/components';
import type { RoleConfig } from '@/features/roles/types';

interface NetworkOpsViewProps {
  config: RoleConfig;
}

export function NetworkOpsView({ }: NetworkOpsViewProps) {
  const navigate = useNavigate();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [currentTheme, setCurrentTheme] = useState('g100');
  const [isLoading, setIsLoading] = useState(true);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [firstRowIndex, setFirstRowIndex] = useState(0);
  const [currentPageSize, setCurrentPageSize] = useState(5);


  const handleViewAlert = useCallback((alertId: string) => {
    navigate(`/alerts/${alertId}`);
  }, [navigate]);

  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await alertDataService.acknowledgeAlert(alertId);
      const updatedAlerts = await alertDataService.getNocAlerts();
      setRecentAlerts(updatedAlerts);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }, []);

  const [enhancedKpiData, setEnhancedKpiData] = useState<any[]>([]);
  const [alertsOverTimeData, setAlertsOverTimeData] = useState<any[]>([]);
  const [severityDist, setSeverityDist] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<SummaryAlert[]>([]);
  const [noisyDevices, setNoisyDevices] = useState<NoisyDevice[]>([]);
  const [aiMetrics, setAiMetrics] = useState<AIMetric[]>([]);

  useEffect(() => {
    const detectTheme = () => {
      try {
        const themeSetting = document.documentElement.getAttribute('data-theme-setting');
        if (themeSetting === 'light') setCurrentTheme('white');
        else if (themeSetting === 'dark') setCurrentTheme('g100');
        else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setCurrentTheme(prefersDark ? 'g100' : 'white');
        }
      } catch { }
    };
    detectTheme();
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-setting'] });
    return () => observer.disconnect();
  }, []);

  // Data fetching with proper cleanup - ONLY REAL DATA FROM DB
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval>;

    const fetchData = async () => {
      if (cancelled) return;
      try {
        setIsLoading(true);
        const results = await Promise.allSettled([
          alertDataService.getAlertsSummary(),
          alertDataService.getAlertsOverTime(selectedTimePeriod),
          alertDataService.getSeverityDistribution(),
          alertDataService.getNocAlerts(),
          alertDataService.getNoisyDevices(),
          alertDataService.getAIMetrics()
        ]);

        // Extract values - NO DEMO DATA FALLBACK, use empty data instead
        const summary = results[0].status === 'fulfilled' && results[0].value?.activeCount != null
          ? results[0].value
          : { activeCount: 0, criticalCount: 0, majorCount: 0, minorCount: 0, warningCount: 0, infoCount: 0, resolvedToday: 0, mttr: '0m' };
        const overTime = results[1].status === 'fulfilled' && Array.isArray(results[1].value) && results[1].value.length > 0
          ? results[1].value
          : [];
        const severity = results[2].status === 'fulfilled' && Array.isArray(results[2].value) && results[2].value.length > 0
          ? results[2].value
          : [];
        const alerts = results[3].status === 'fulfilled' && Array.isArray(results[3].value) && results[3].value.length > 0
          ? results[3].value
          : [];
        const devices = results[4].status === 'fulfilled' && Array.isArray(results[4].value) && results[4].value.length > 0
          ? results[4].value
          : [];
        const metrics = results[5].status === 'fulfilled' && Array.isArray(results[5].value) && results[5].value.length > 0
          ? results[5].value
          : [];

        if (cancelled) return;

        // Build enhanced KPI data with icon colors matching Dashboard.png
        // Extract AI accuracy from metrics if available
        const aiAccuracyMetric = metrics.find(m => m.label?.toLowerCase().includes('accuracy'));
        const aiAccuracyValue = aiAccuracyMetric ? parseFloat(String(aiAccuracyMetric.value)) : null;

        const enhancedKpis = [
          {
            id: 'total-alerts',
            label: 'Active Alerts',
            value: summary?.activeCount || 0,
            icon: Notification,
            iconColor: '#0f62fe', // Blue
            severity: 'info' as KPISeverity,
            trend: { direction: 'stable' as const, value: 'vs last hour', isPositive: true },
            subtitle: 'Total alerts in system'
          },
          {
            id: 'critical-alerts',
            label: 'Critical',
            value: summary?.criticalCount || 0,
            icon: WarningAltFilled,
            iconColor: '#da1e28', // Red
            severity: 'critical' as KPISeverity,
            subtitle: 'Requires immediate attention'
          },
          {
            id: 'major-alerts',
            label: 'Major',
            value: summary?.majorCount || 0,
            icon: WarningAlt,
            iconColor: '#ff832b', // Orange
            severity: 'major' as KPISeverity,
            subtitle: 'Service impacting'
          },
          {
            id: 'ai-accuracy',
            label: 'AI Accuracy',
            value: aiAccuracyValue !== null ? `${aiAccuracyValue}%` : 'N/A',
            icon: Analytics,
            iconColor: aiAccuracyValue !== null && aiAccuracyValue >= 90 ? '#8a3ffc' : '#ff832b', // Purple if good, orange if not
            severity: (aiAccuracyValue !== null && aiAccuracyValue >= 90 ? 'success' : 'major') as KPISeverity,
            subtitle: aiAccuracyValue !== null ? 'Based on recent correlations' : 'Data unavailable'
          }
        ];

        setEnhancedKpiData(enhancedKpis);
        setAlertsOverTimeData(overTime || []);
        setSeverityDist(severity || []);
        setRecentAlerts((alerts || []).map((a: any) => normalizeAlert(a)));
        setNoisyDevices(devices || []);
        setAiMetrics(metrics || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    interval = setInterval(fetchData, 30000);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [selectedTimePeriod]);

  // Transform alerts for AlertTicker component
  const tickerAlerts: CriticalAlert[] = useMemo(() =>
    (recentAlerts || [])
      .filter(a => a.severity === 'critical' || a.severity === 'high' || a.severity === 'major')
      .slice(0, 8)
      .map(a => {
        // Ensure deviceName is always a primitive/string to avoid rendering objects as React children
        let deviceName = 'Unknown';
        if (a.device && typeof a.device.name === 'string') deviceName = a.device.name;
        else if (a.device && typeof a.device === 'string') deviceName = a.device;
        else if (a.device && a.device.name) deviceName = String(a.device.name);

        return {
          id: a.id,
          timestamp: typeof a.timestamp === 'string' ? a.timestamp : a.timestamp?.relative || 'Now',
          message: a.aiSummary || 'Alert detected',
          deviceName,
          severity: a.severity as 'critical' | 'high' | 'major'
        };
      }),
    [recentAlerts]
  );

  // Transform NoisyDevice API data to NoisyDeviceItem for UI component
  // Cast to any to handle potential different API response formats defensively
  const noisyDeviceItems: NoisyDeviceItem[] = useMemo(() =>
    (noisyDevices || []).map((d): NoisyDeviceItem => {
      // Cast to any to handle potential nested API formats
      const data = d as any;

      // Extract name - ensure it's always a string
      let deviceName = 'Unknown Device';
      if (typeof d.name === 'string') {
        deviceName = d.name;
      } else if (data.device && typeof data.device === 'object' && typeof data.device.name === 'string') {
        deviceName = data.device.name;
      } else if (typeof data.device_name === 'string') {
        deviceName = data.device_name;
      } else if (typeof d === 'string') {
        deviceName = d;
      }

      // Extract IP - ensure it's always a string
      let deviceIp = '';
      if (data.device && typeof data.device === 'object' && typeof data.device.ip === 'string') {
        deviceIp = data.device.ip;
      } else if (typeof data.device_ip === 'string') {
        deviceIp = data.device_ip;
      }

      const alertCount = d.alertCount || 0;

      return {
        device: {
          name: String(deviceName),
          ip: String(deviceIp),
          icon: 'switch' as const, // Default icon
        },
        alertCount,
        severity: alertCount > 10 ? 'critical' : alertCount > 5 ? 'major' : 'minor',
      };
    }),
    [noisyDevices]
  );
  const areaChartOptions = useMemo(() =>
    createAreaChartOptions({ title: 'Alerts Over Time', height: '320px', theme: currentTheme, showTitle: false }),
    [currentTheme]
  );

  const donutChartOptions = useMemo(() =>
    createDonutChartOptions({ title: 'Severity Distribution', height: '300px', theme: currentTheme, showTitle: false }),
    [currentTheme]
  );

  const headers = [
    { key: 'timestamp', header: 'TIMESTAMP' },
    { key: 'device', header: 'DEVICE' },
    { key: 'severity', header: 'SEVERITY' },
    { key: 'aiSummary', header: 'SUMMARY' },
    { key: 'status', header: 'STATUS' },
    { key: 'actions', header: 'ACTIONS' },
  ];

  // Search & Pagination Logic
  const filteredAlerts = useMemo(() => {
    let result = recentAlerts;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(alert =>
        alert.device?.name?.toLowerCase().includes(lowerQuery) ||
        (alert.id || '').toLowerCase().includes(lowerQuery) ||
        alert.aiSummary?.toLowerCase().includes(lowerQuery) ||
        (alert.severity || '').toLowerCase().includes(lowerQuery) ||
        (alert.status || '').toLowerCase().includes(lowerQuery)
      );
    }
    return result;
  }, [recentAlerts, searchQuery]);

  const paginatedAlerts = useMemo(() => {
    return filteredAlerts.slice(firstRowIndex, firstRowIndex + currentPageSize);
  }, [filteredAlerts, firstRowIndex, currentPageSize]);

  // Transform alerts to DataTable-compatible format (primitive values for each key)
  const tableRows = useMemo(() =>
    paginatedAlerts.map(alert => ({
      id: alert.id,
      timestamp: typeof alert.timestamp === 'string' ? alert.timestamp : alert.timestamp?.relative || 'N/A',
      // Coerce device display value to a string to avoid passing objects to the DataTable cell renderer
      device: (alert.device && typeof alert.device.name === 'string')
        ? alert.device.name
        : (alert.device ? JSON.stringify(alert.device) : 'Unknown'),
      severity: alert.severity,
      aiSummary: alert.aiSummary || 'No summary',
      status: alert.status,
      actions: '', // Rendered custom
    })),
    [paginatedAlerts]
  );


  if (isLoading && enhancedKpiData.length === 0) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div className="header-left">
            <SkeletonText heading width="300px" />
            <SkeletonText width="400px" />
          </div>
          <div className="header-right">
            <SkeletonPlaceholder style={{ width: '150px', height: '32px' }} />
          </div>
        </div>
        <div className="kpi-row">
          {[1, 2, 3, 4].map((i) => (
            <Tile key={i} className="kpi-card-skeleton">
              <SkeletonText width="60%" />
              <SkeletonText heading width="40%" />
              <SkeletonText width="80%" />
            </Tile>
          ))}
        </div>
        <div className="charts-row">
          <Tile className="chart-tile">
            <SkeletonText heading width="200px" />
            <SkeletonPlaceholder style={{ width: '100%', height: '300px', marginTop: '1rem' }} />
          </Tile>
          <Tile className="chart-tile">
            <SkeletonText heading width="200px" />
            <SkeletonPlaceholder style={{ width: '100%', height: '300px', marginTop: '1rem' }} />
          </Tile>
        </div>
        <DataTableSkeleton columnCount={headers.length} rowCount={5} showHeader showToolbar />
      </div>
    );
  }


  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">Network Operations Center</h1>
          <p className="dashboard-subtitle">Real-time monitoring and AI-powered alert analysis</p>
        </div>
        <div className="header-right">
          <span className="cds--tag cds--tag--green cds--tag--md">
            <CheckmarkFilled size={16} className="cds--tag__custom-icon" />
            System Operational
          </span>
        </div>
      </div>

      {/* Critical Alert Ticker - New Component */}
      <AlertTicker
        alerts={tickerAlerts}
        onAlertClick={(id) => navigate(`/alerts/${id}`)}
        speed={35}
      />

      {/* KPI Cards */}
      <div className="kpi-row">
        {enhancedKpiData.map((kpi) => (
          <KPICard
            key={kpi.id}
            id={kpi.id}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            iconColor={kpi.iconColor}
            severity={kpi.severity}
            trend={kpi.trend}
            subtitle={kpi.subtitle}
          />
        ))}
      </div>

      <div className="charts-row">
        <Tile className="chart-tile chart-tile--area">
          <div className="chart-header">
            <h3>Alerts Over Time</h3>
            <div className="time-period-buttons">
              {(['24h', '7d', '30d'] as const).map((period) => (
                <Button
                  key={period}
                  kind={selectedTimePeriod === period ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTimePeriod(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
          <div className="chart-container">
            <ChartWrapper
              ChartComponent={StackedAreaChart}
              data={alertsOverTimeData}
              options={areaChartOptions}
              height="350px"
            />
          </div>
        </Tile>
        <Tile className="chart-tile chart-tile--donut">
          <div className="chart-header">
            <h3>Severity Distribution</h3>
          </div>
          <div className="chart-container chart-container--centered" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ChartWrapper
              ChartComponent={DonutChart}
              data={severityDist}
              options={donutChartOptions}
              height="350px"
            />
          </div>
        </Tile>
      </div>

      {/* Table Section using DataTableWrapper */}
      <DataTableWrapper
        title="Recent Alerts"
        onSearch={(value) => {
          setSearchQuery(value);
          setFirstRowIndex(0);
        }}
        searchPlaceholder="Search alerts..."
        searchValue={searchQuery}
        showFilter={true}
        showRefresh={true}
      >
        <DataTable rows={tableRows} headers={headers}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer>
              <Table {...getTableProps()}>
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
                    const alert = recentAlerts.find((a) => a.id === row.id);
                    if (!alert) return null;

                    // Safely render timestamp
                    const renderTimestamp = () => {
                      try {
                        if (typeof alert.timestamp === 'string') {
                          return alert.timestamp;
                        }
                        if (alert.timestamp?.relative) {
                          return alert.timestamp.relative;
                        }
                        if (alert.timestamp?.absolute) {
                          // Format the absolute timestamp
                          const date = new Date(alert.timestamp.absolute);
                          if (!isNaN(date.getTime())) {
                            return date.toLocaleString();
                          }
                        }
                        return 'N/A';
                      } catch (e) {
                        console.error('Error rendering timestamp:', e, alert.timestamp);
                        return 'N/A';
                      }
                    };

                    return (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        <TableCell>{renderTimestamp()}</TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getDeviceIcon(alert.device?.icon || 'server')}
                            <span>
                              {typeof alert.device?.name === 'string'
                                ? alert.device.name
                                : (alert.device ? String(alert.device.name ?? alert.device.ip ?? JSON.stringify(alert.device)) : 'Unknown')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getSeverityTag(alert.severity)}</TableCell>
                        <TableCell>
                          <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={alert.aiSummary || ''}>
                            {alert.aiSummary || 'No summary'}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusTag(alert.status)}</TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                            <Button
                              kind="ghost" size="sm" renderIcon={View}
                              hasIconOnly iconDescription="View"
                              onClick={() => handleViewAlert(alert.id)}
                            />
                            <Button
                              kind="ghost" size="sm" renderIcon={Checkmark}
                              hasIconOnly iconDescription="Acknowledge"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>

        <Pagination
          totalItems={filteredAlerts.length}
          backwardText="Previous page"
          forwardText="Next page"
          pageSize={currentPageSize}
          pageSizes={[5, 10, 20]}
          itemsPerPageText="Items per page"
          onChange={({ page, pageSize }) => {
            if (pageSize !== currentPageSize) {
              setCurrentPageSize(pageSize);
            }
            setFirstRowIndex((page - 1) * pageSize);
          }}
        />
      </DataTableWrapper>

      <div className="bottom-row">
        <NoisyDevicesCard title="Top Noisy Devices" devices={noisyDeviceItems} variant="simple" />
        <Tile className="bottom-tile">
          <h3>AI Impact Metrics</h3>
          <div className="metrics-list">
            {aiMetrics.map((metric, idx) => (
              <div key={idx} className="metric-row">
                <div className="metric-left">
                  <div className="metric-name">{metric.label}</div>
                  <ProgressBar
                    label={metric.label}
                    value={typeof metric.value === 'number' ? metric.value : parseFloat(String(metric.value)) || 0}
                    max={100}
                    hideLabel
                    size="small"
                  />
                </div>
                <div className={`metric-change ${metric.trend || 'stable'}`}>
                  {metric.description || `${typeof metric.value === 'number' ? Math.round(metric.value * 10) / 10 : metric.value}%`}
                </div>
              </div>
            ))}
          </div>
        </Tile>
      </div>
    </div>
  );
}

export default NetworkOpsView;
