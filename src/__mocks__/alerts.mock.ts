/**
 * Alert Mock Data
 * 
 * All mock data for alerts and app. Uses types from @/constants/alerts
 * 
 * Usage:
 *   import { MOCK_PRIORITY_ALERTS, MOCK_USER, getActiveAlertCount } from '@/__mocks__/alerts.mock';
 */

import {
    SEVERITY_CONFIG,
    type Severity,
    type DeviceInfo,
    type ExtendedDeviceInfo,
    type TimestampInfo,
    type SummaryAlert,
    type PriorityAlert,
    type DetailedAlert,
    type HistoricalAlert,
    type ChartDataPoint,
    type DistributionDataPoint,
    type NoisyDevice,
    type AIMetric,
    type TimePeriod,
} from '../constants/alerts';

// ==========================================
// User & Navigation Mock Data
// ==========================================

export interface MockUser {
    name: string;
    role: string;
    initials: string;
    email?: string;
}

export interface SearchableItem {
    label: string;
    path: string;
    type: 'page' | 'device' | 'alert' | 'ticket';
}

export const MOCK_USER: MockUser = {
    name: 'John Doe',
    role: 'L2 Engineer',
    initials: 'JD',
    email: 'john.doe@example.com',
};

export const SEARCHABLE_ITEMS: SearchableItem[] = [
    { label: 'Dashboard', path: '/dashboard', type: 'page' },
    { label: 'Priority Alerts', path: '/priority-alerts', type: 'page' },
    { label: 'Trends & Insights', path: '/trends', type: 'page' },
    { label: 'Tickets', path: '/tickets', type: 'page' },
    { label: 'Device Explorer', path: '/devices', type: 'page' },
    { label: 'Settings', path: '/settings', type: 'page' },
    { label: 'Core-SW-01', path: '/devices/core-sw-01', type: 'device' },
    { label: 'RTR-EDGE-05', path: '/devices/rtr-edge-05', type: 'device' },
    { label: 'FW-DMZ-03', path: '/devices/fw-dmz-03', type: 'device' },
];

// ==========================================
// Shared Device Database
// ==========================================

export const DEVICES: Record<string, DeviceInfo> = {
    'core-sw-01': {
        name: 'Core-SW-01',
        ip: '192.168.1.10',
        icon: 'switch',
        model: 'Cisco Catalyst 9300',
        vendor: 'Cisco Systems',
    },
    'fw-dmz-03': {
        name: 'FW-DMZ-03',
        ip: '172.16.3.1',
        icon: 'firewall',
        model: 'Palo Alto PA-5220',
        vendor: 'Palo Alto Networks',
    },
    'rtr-edge-05': {
        name: 'RTR-EDGE-05',
        ip: '10.0.5.1',
        icon: 'router',
        model: 'Juniper MX960',
        vendor: 'Juniper Networks',
    },
    'db-prod-01': {
        name: 'DB-PROD-01',
        ip: '10.1.2.10',
        icon: 'server',
        model: 'Dell PowerEdge R750',
        vendor: 'Dell Technologies',
    },
    'db-prod-02': {
        name: 'DB-PROD-02',
        ip: '10.1.2.15',
        icon: 'server',
        model: 'Dell PowerEdge R750',
        vendor: 'Dell Technologies',
    },
    'sw-access-12': {
        name: 'SW-ACCESS-12',
        ip: '192.168.12.1',
        icon: 'switch',
        model: 'Cisco Catalyst 3850',
        vendor: 'Cisco Systems',
    },
    'lb-web-01': {
        name: 'LB-WEB-01',
        ip: '10.2.1.5',
        icon: 'server',
        model: 'F5 BIG-IP i5800',
        vendor: 'F5 Networks',
    },
    'ap-floor3-12': {
        name: 'AP-FLOOR3-12',
        ip: '192.168.50.12',
        icon: 'wireless',
        model: 'Cisco Aironet 9120',
        vendor: 'Cisco Systems',
    },
};

// Helper
function ts(absolute: string, relative?: string): TimestampInfo {
    return { absolute, relative };
}

// ==========================================
// Dashboard NOC Alerts
// ==========================================

export const MOCK_NOC_ALERTS: SummaryAlert[] = [
    {
        id: 'noc-001',
        severity: 'critical',
        status: 'new',
        timestamp: ts('2024-01-16 14:32:18', '2m ago'),
        device: DEVICES['core-sw-01'],
        aiSummary: 'Interface Gi0/0(Ethernet) down - Link failure detected',
    },
    {
        id: 'noc-002',
        severity: 'critical',
        status: 'new',
        timestamp: ts('2024-01-16 14:34:46', '5m ago'),
        device: DEVICES['fw-dmz-03'],
        aiSummary: 'CPU utilization exceeded 95% - Possible DDoS attack or misconfiguration',
    },
    {
        id: 'noc-003',
        severity: 'major',
        status: 'acknowledged',
        timestamp: ts('2024-01-16 14:37:22', '12m ago'),
        device: DEVICES['rtr-edge-05'],
        aiSummary: 'BGP peer session flapping - Route instability detected on AS64500',
    },
    {
        id: 'noc-004',
        severity: 'minor',
        status: 'resolved',
        timestamp: ts('2024-01-16 14:08:11', '30m ago'),
        device: DEVICES['db-prod-02'],
        aiSummary: 'Memory usage at 78% - Consider scaling or optimization',
    },
    {
        id: 'noc-005',
        severity: 'info',
        status: 'acknowledged',
        timestamp: ts('2024-01-16 13:58:33', '45m ago'),
        device: DEVICES['ap-floor3-12'],
        aiSummary: 'Client count exceeded threshold - 150 clients connected',
    },
];

// ==========================================
// Priority Alerts
// ==========================================

export const MOCK_PRIORITY_ALERTS: PriorityAlert[] = [
    {
        id: 'pa-001',
        severity: 'critical',
        status: 'new',
        timestamp: ts('14:23:45', '2 min ago'),
        device: DEVICES['core-sw-01'],
        aiTitle: 'Interface GigabitEthernet1/0/24 has gone down',
        aiSummary: 'Multiple interfaces experiencing connectivity issues. Possible hardware failure or cable disconnection detected.',
        confidence: 94,
    },
    {
        id: 'pa-002',
        severity: 'critical',
        status: 'new',
        timestamp: ts('14:20:12', '5 min ago'),
        device: DEVICES['core-sw-01'],
        aiTitle: 'Interface GigabitEthernet1/0/12 has gone down',
        aiSummary: 'Critical link failure detected. This interface connects to distribution layer switch.',
        confidence: 96,
    },
    {
        id: 'pa-003',
        severity: 'critical',
        status: 'acknowledged',
        timestamp: ts('14:13:28', '12 min ago'),
        device: DEVICES['db-prod-01'],
        aiTitle: 'Database connection pool exhausted',
        aiSummary: 'Maximum connection limit reached. Application performance severely degraded.',
        confidence: 91,
    },
    {
        id: 'pa-004',
        severity: 'major',
        status: 'in-progress',
        timestamp: ts('14:07:15', '18 min ago'),
        device: DEVICES['fw-dmz-03'],
        aiTitle: 'High CPU utilization detected (85%)',
        aiSummary: 'Firewall processing load exceeding normal thresholds. May indicate DDoS attack.',
        confidence: 88,
    },
    {
        id: 'pa-005',
        severity: 'major',
        status: 'new',
        timestamp: ts('14:00:42', '25 min ago'),
        device: DEVICES['rtr-edge-05'],
        aiTitle: 'BGP peer session flapping detected',
        aiSummary: 'BGP neighbor 10.0.5.2 experiencing unstable connection. Session torn down 5 times.',
        confidence: 92,
    },
    {
        id: 'pa-006',
        severity: 'minor',
        status: 'acknowledged',
        timestamp: ts('13:53:18', '32 min ago'),
        device: DEVICES['sw-access-12'],
        aiTitle: 'Port security violation on Gi1/0/8',
        aiSummary: 'Unauthorized MAC address detected on secured port. Port in error-disabled state.',
        confidence: 87,
    },
    {
        id: 'pa-007',
        severity: 'minor',
        status: 'resolved',
        timestamp: ts('13:40:33', '45 min ago'),
        device: DEVICES['lb-web-01'],
        aiTitle: 'Backend server health check failing',
        aiSummary: 'Web server 10.2.1.15 not responding. Server removed from load balancer pool.',
        confidence: 89,
    },
    {
        id: 'pa-008',
        severity: 'info',
        status: 'resolved',
        timestamp: ts('13:25:10', '1 hour ago'),
        device: DEVICES['db-prod-02'],
        aiTitle: 'Scheduled backup completed successfully',
        aiSummary: 'Daily database backup finished. Backup size: 45.2 GB. All checks passed.',
        confidence: 98,
    },
];

// ==========================================
// Alert Detail
// ==========================================

const DETAILED_DEVICE: ExtendedDeviceInfo = {
    ...DEVICES['core-sw-01'],
    location: 'DataCenter-A-Rack-12',
    interface: 'GigabitEthernet0/1',
    interfaceAlias: 'Uplink to Distribution Layer',
};

const HISTORICAL_ALERTS: HistoricalAlert[] = [
    {
        id: 'hist-001',
        timestamp: '2024-03-13 09:13:33',
        title: 'Interface GigabitEthernet0/1 down',
        resolution: 'Resolved in 12 minutes - Cable reseated',
        severity: 'critical',
    },
    {
        id: 'hist-002',
        timestamp: '2024-01-06 16:48:11',
        title: 'Interface GigabitEthernet0/1 down',
        resolution: 'Resolved in 8 minutes - SFP module replaced',
        severity: 'critical',
    },
    {
        id: 'hist-003',
        timestamp: '2024-03-03 11:28:45',
        title: 'Interface flapping detected',
        resolution: 'Resolved in 25 minutes - Firmware updated',
        severity: 'major',
    },
];

export const MOCK_ALERT_DETAIL: DetailedAlert = {
    id: 'alert-001',
    severity: 'critical',
    status: 'new',
    timestamp: ts('2024-01-15 14:32:18 UTC', '8m 42s'),
    device: DEVICES['core-sw-01'],
    aiTitle: 'Interface GigabitEthernet0/1 Down',
    aiSummary: 'Network interface has transitioned to down state while administrative status remains up.',
    confidence: 94,
    similarEvents: 7,
    aiAnalysis: {
        summary: 'The network interface GigabitEthernet0/1 on Core-SW-01 has transitioned to a down state while the administrative status remains up. This indicates a physical layer failure or cable disconnection rather than an intentional shutdown.',
        rootCauses: [
            'Physical layer failure detected (link down while admin up)',
            'Interface is configured as uplink to distribution layer',
            'Possible causes: cable fault, SFP failure, or remote device issue',
        ],
        businessImpact: 'High - Loss of redundancy to distribution layer. Network resilience compromised.',
        recommendedActions: [
            'Verify physical cable connection and SFP module status',
            'Check remote device (distribution switch) operational status',
            'Review interface error counters and logs for additional context',
            'If issue persists, replace cable or SFP module',
        ],
    },
    rawData: `SNMP-v2-MIB::sysUpTime.0 = 123456789
IF-MIB::linkDown.0 = 1
IF-MIB::ifAdminStatus.1 = up(1)
IF-MIB::ifOperStatus.1 = down(2)
IF-MIB::ifAlias.1 = uplink to Distribution Layer
IF-MIB::ifSpeed.1 = 1000000000
SNMP-COMMUNITY-MIB::snmpTrapAddress.0 = 192.168.1.100
SNMP-COMMUNITY-MIB::snmpTrapCommunity.0 = public`,
    extendedDevice: DETAILED_DEVICE,
    history: HISTORICAL_ALERTS,
};

// ==========================================
// Chart Data: Alerts Over Time
// ==========================================

interface TimeSeriesConfig {
    intervals: number;
    intervalMs: number;
    baseValues: Record<Severity, number[]>;
}

const TIME_SERIES_CONFIG: Record<TimePeriod, TimeSeriesConfig> = {
    '24h': {
        intervals: 7,
        intervalMs: 4 * 60 * 60 * 1000,
        baseValues: {
            critical: [15, 22, 35, 45, 38, 28, 18],
            major: [32, 45, 62, 88, 95, 78, 55],
            minor: [68, 75, 92, 115, 125, 108, 85],
            info: [25, 28, 35, 42, 48, 38, 30],
        },
    },
    '7d': {
        intervals: 7,
        intervalMs: 24 * 60 * 60 * 1000,
        baseValues: {
            critical: [85, 92, 78, 95, 110, 88, 72],
            major: [180, 220, 195, 240, 280, 235, 190],
            minor: [320, 380, 350, 410, 450, 390, 340],
            info: [150, 180, 165, 195, 220, 185, 160],
        },
    },
    '30d': {
        intervals: 6,
        intervalMs: 5 * 24 * 60 * 60 * 1000,
        baseValues: {
            critical: [420, 480, 510, 450, 390, 360],
            major: [980, 1100, 1250, 1180, 1050, 920],
            minor: [1800, 2100, 2350, 2200, 1950, 1750],
            info: [850, 920, 1050, 980, 880, 800],
        },
    },
    '90d': {
        intervals: 6,
        intervalMs: 15 * 24 * 60 * 60 * 1000,
        baseValues: {
            critical: [1200, 1350, 1500, 1400, 1250, 1100],
            major: [2800, 3200, 3600, 3400, 3000, 2600],
            minor: [5200, 6000, 6800, 6400, 5600, 5000],
            info: [2400, 2800, 3200, 3000, 2600, 2200],
        },
    },
};

function generateAlertsOverTime(period: TimePeriod): ChartDataPoint[] {
    const now = new Date();
    const config = TIME_SERIES_CONFIG[period];
    const data: ChartDataPoint[] = [];

    (['critical', 'major', 'minor', 'info'] as Severity[]).forEach((severity) => {
        const values = config.baseValues[severity];
        for (let i = 0; i < config.intervals; i++) {
            const date = new Date(now.getTime() - (config.intervals - 1 - i) * config.intervalMs);
            data.push({ group: SEVERITY_CONFIG[severity].label, date, value: values[i] });
        }
    });

    return data;
}

export const ALERTS_OVER_TIME: Record<TimePeriod, ChartDataPoint[]> = {
    '24h': generateAlertsOverTime('24h'),
    '7d': generateAlertsOverTime('7d'),
    '30d': generateAlertsOverTime('30d'),
    '90d': generateAlertsOverTime('90d'),
};

// ==========================================
// Chart Data: Severity Distribution
// ==========================================

export const MOCK_SEVERITY_DISTRIBUTION: DistributionDataPoint[] = [
    { group: 'Critical', value: 12 },
    { group: 'Major', value: 47 },
    { group: 'Minor', value: 68 },
    { group: 'Info', value: 120 },
];

// ==========================================
// Top Noisy Devices
// ==========================================

export const MOCK_TOP_NOISY_DEVICES: NoisyDevice[] = [
    { device: DEVICES['core-sw-01'], model: DEVICES['core-sw-01'].model!, alertCount: 247, severity: 'critical' },
    { device: DEVICES['fw-dmz-03'], model: DEVICES['fw-dmz-03'].model!, alertCount: 189, severity: 'major' },
    { device: DEVICES['rtr-edge-05'], model: DEVICES['rtr-edge-05'].model!, alertCount: 156, severity: 'minor' },
];

// ==========================================
// AI Impact Metrics
// ==========================================

export const MOCK_AI_IMPACT_METRICS: AIMetric[] = [
    { name: 'Alert Resolution Time', value: 42, change: '+2%', trend: 'positive' },
    { name: 'False Positive Rate', value: 68, change: '-68%', trend: 'positive' },
    { name: 'Escalation Reduction', value: 65, change: '+65%', trend: 'positive' },
    { name: 'Operator Confidence', value: 89, change: '+89%', trend: 'positive' },
];

// ==========================================
// Trends & Insights Mock Data
// ==========================================

export const MOCK_TRENDS_KPI = [
    {
        id: 'alert-volume',
        label: 'Alert Volume',
        value: '-12%',
        subtitle: 'Compared to last period',
        trend: 'down' as const,
        tag: { text: 'Improving', type: 'green' },
    },
    {
        id: 'mttr',
        label: 'MTTR',
        value: '8.5m',
        subtitle: 'Mean Time To Resolution',
        trend: 'down' as const,
    },
    {
        id: 'recurring-alerts',
        label: 'Recurring Alerts',
        value: '23%',
        subtitle: 'Of total volume',
        trend: 'up' as const,
        tag: { text: 'Needs Attention', type: 'red' },
    },
    {
        id: 'escalation-rate',
        label: 'Escalation Rate',
        value: '4.2%',
        subtitle: 'L1 to L2/L3 handoff',
        trend: 'stable' as const,
    },
];

export const MOCK_TOP_RECURRING_ALERT_TYPES = [
    {
        id: 'rec-001',
        name: 'Interface Flapping',
        count: 247,
        severity: 'major',
        avgResolution: '12m',
        percentage: 100,
    },
    {
        id: 'rec-002',
        name: 'High CPU Utilization',
        count: 189,
        severity: 'minor',
        avgResolution: '8m',
        percentage: 76,
    },
    {
        id: 'rec-003',
        name: 'Memory Threshold Exceeded',
        count: 156,
        severity: 'minor',
        avgResolution: '15m',
        percentage: 63,
    },
];

export const MOCK_ALERT_DISTRIBUTION_TIME = [
    { group: 'Morning (6am-12pm)', value: 145 },
    { group: 'Afternoon (12pm-6pm)', value: 210 },
    { group: 'Evening (6pm-12am)', value: 98 },
    { group: 'Night (12am-6am)', value: 42 },
];

export const MOCK_AI_INSIGHTS = [
    {
        id: 'insight-001',
        type: 'pattern' as const,
        description: 'Recurring BGP flaps detected on RTR-EDGE-05 every Tuesday between 2-3 PM, coinciding with scheduled backups.',
        action: 'Adjust Backup Schedule',
    },
    {
        id: 'insight-002',
        type: 'optimization' as const,
        description: 'Alert noise reduced by 45% after implementing AI-based correlation rules on Core-SW cluster.',
        action: 'Apply to Other Clusters',
    },
    {
        id: 'insight-003',
        type: 'recommendation' as const,
        description: 'Consider upgrading firmware on FW-DMZ-03 to address known CPU spike issues under heavy load.',
        action: 'Schedule Maintenance',
    },
];

// ==========================================
// Utility Functions
// ==========================================

export function getAlertById(id: string): PriorityAlert | undefined {
    return MOCK_PRIORITY_ALERTS.find((alert) => alert.id === id);
}

/** Get count of active (non-resolved, non-dismissed) alerts */
export function getActiveAlertCount(): number {
    return MOCK_PRIORITY_ALERTS.filter(
        (alert) => alert.status !== 'resolved' && alert.status !== 'dismissed'
    ).length;
}

/** Get count of alerts by severity */
export function getAlertCountBySeverity(severity: Severity): number {
    return MOCK_PRIORITY_ALERTS.filter((alert) => alert.severity === severity).length;
}

/** Get count of critical alerts that are not resolved */
export function getCriticalAlertCount(): number {
    return MOCK_PRIORITY_ALERTS.filter(
        (alert) => alert.severity === 'critical' && alert.status !== 'resolved' && alert.status !== 'dismissed'
    ).length;
}
