/**
 * Configuration Page Types & Shared Utilities
 *
 * Shared interfaces, constants, and helpers used across all configuration tab components.
 */

import React from 'react';
import { Tag } from '@carbon/react';
import { LogoSlack, Email, Phone } from '@carbon/icons-react';

import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';

// ==========================================
// Types
// ==========================================

export interface Rule {
    id: string;
    name: string;
    description: string;
    condition: string;
    duration: string;
    severity: string;
    enabled: boolean;
}

export interface Channel {
    id: string;
    name: string;
    type: string;
    meta: string;
    active: boolean;
}

export interface Policy {
    id: string;
    name: string;
    description: string;
    steps: number;
    active: boolean;
}

export interface Maintenance {
    id: string;
    name: string;
    schedule: string;
    duration: string;
    status: string;
}

export interface RuleEditForm {
    name: string;
    description: string;
    conditionMetric: string;
    conditionOperator: string;
    conditionValue: number;
    durationValue: number;
    durationUnit: string;
    severity: string;
}

export interface ChannelForm {
    name: string;
    type: string;
    meta: string;
}

export interface PolicyForm {
    name: string;
    description: string;
    steps: number;
}

export interface MaintenanceForm {
    name: string;
    scheduleDayOfWeek: string;
    scheduleHour: number;
    scheduleMinute: number;
    durationValue: number;
    durationUnit: string;
    status: string;
}

export interface GlobalSettings {
    maintenanceMode: boolean;
    autoResolve: boolean;
    aiCorrelation: boolean;
}

// ==========================================
// HTTP Client
// ==========================================

class ConfigHttpClient extends HttpService {
    constructor() {
        super(`${env.apiBaseUrl}/api/${env.apiVersion}`, 'ConfigurationPage');
    }
    async fetchGet<T>(endpoint: string): Promise<T> { return this.get<T>(endpoint); }
    async fetchPost<T>(endpoint: string, data: unknown): Promise<T> { return this.post<T>(endpoint, data); }
    async fetchPut<T>(endpoint: string, data: unknown): Promise<T> { return this.put<T>(endpoint, data); }
    async fetchDelete<T>(endpoint: string): Promise<T> { return this.delete<T>(endpoint); }
}

export const httpClient = new ConfigHttpClient();

// ==========================================
// Constants
// ==========================================

export const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
    Slack: LogoSlack,
    Email,
    Twilio: Phone,
};

export const CONDITION_METRICS = [
    { value: 'CPU', label: 'CPU Utilization', unit: '%' },
    { value: 'Memory', label: 'Memory Usage', unit: '%' },
    { value: 'Disk', label: 'Disk Usage', unit: '%' },
    { value: 'Bandwidth', label: 'Bandwidth Usage', unit: '%' },
    { value: 'Latency', label: 'Network Latency', unit: 'ms' },
    { value: 'Packet Loss', label: 'Packet Loss', unit: '%' },
    { value: 'Interface Errors', label: 'Interface Errors', unit: '/min' },
    { value: 'Response Time', label: 'Response Time', unit: 'ms' },
    { value: 'Temperature', label: 'Temperature', unit: '\u00B0C' },
];

export const CONDITION_OPERATORS = ['>', '<', '>=', '<=', '==', '!='];

export const RULES_HEADERS = [
    { header: 'Status', key: 'enabled' },
    { header: 'Rule Name', key: 'name' },
    { header: 'Condition', key: 'condition' },
    { header: 'Severity', key: 'severity' },
    { header: 'Actions', key: 'actions' },
];

export const CHANNELS_HEADERS = [
    { header: 'Type', key: 'type' },
    { header: 'Channel Name', key: 'name' },
    { header: 'Status', key: 'status' },
    { header: 'Active', key: 'active' },
    { header: '', key: 'actions' },
];

export const POLICIES_HEADERS = [
    { header: 'Policy Name', key: 'name' },
    { header: 'Description', key: 'description' },
    { header: 'Steps', key: 'steps' },
    { header: 'Active', key: 'active' },
    { header: '', key: 'actions' },
];

export const MAINTENANCE_HEADERS = [
    { header: 'Name', key: 'name' },
    { header: 'Schedule', key: 'schedule' },
    { header: 'Duration', key: 'duration' },
    { header: 'Status', key: 'status' },
    { header: '', key: 'actions' },
];

export const DEFAULT_RULE_FORM: RuleEditForm = {
    name: '',
    description: '',
    conditionMetric: 'CPU',
    conditionOperator: '>',
    conditionValue: 90,
    durationValue: 5,
    durationUnit: 'minutes',
    severity: 'warning',
};

export const DEFAULT_CHANNEL_FORM: ChannelForm = {
    name: '',
    type: 'Slack',
    meta: '',
};

export const DEFAULT_POLICY_FORM: PolicyForm = {
    name: '',
    description: '',
    steps: 1,
};

export const DEFAULT_MAINTENANCE_FORM: MaintenanceForm = {
    name: '',
    scheduleDayOfWeek: 'Sunday',
    scheduleHour: 2,
    scheduleMinute: 0,
    durationValue: 2,
    durationUnit: 'hours',
    status: 'scheduled',
};

// ==========================================
// Helpers
// ==========================================

export function parseCondition(condition: string): { metric: string; operator: string; value: number | string } {
    // Match numeric conditions: "CPU > 90"
    const numMatch = condition.match(/^(.+?)\s*(>=|<=|==|!=|>|<)\s*(\d+)/);
    if (numMatch) {
        return { metric: numMatch[1].trim(), operator: numMatch[2], value: parseInt(numMatch[3]) };
    }
    // Match text conditions: "BGP State != Established"
    const textMatch = condition.match(/^(.+?)\s*(>=|<=|==|!=|>|<)\s*(.+)/);
    if (textMatch) {
        return { metric: textMatch[1].trim(), operator: textMatch[2], value: textMatch[3].trim() };
    }
    // Fallback: show the whole condition as metric
    return { metric: condition, operator: '', value: '' };
}

export function composeCondition(metric: string, operator: string, value: number) {
    const metricDef = CONDITION_METRICS.find(m => m.value === metric);
    const unit = metricDef?.unit || '';
    return `${metric} ${operator} ${value}${unit}`;
}

export function parseSchedule(schedule: string) {
    const dayMatch = schedule.match(/(?:Every\s+)?(\w+day)/i);
    const timeMatch = schedule.match(/(\d{1,2}):(\d{2})/);
    return {
        day: dayMatch ? dayMatch[1] : 'Sunday',
        hour: timeMatch ? parseInt(timeMatch[1]) : 2,
        minute: timeMatch ? parseInt(timeMatch[2]) : 0,
    };
}

export function parseDuration(duration: string) {
    const match = duration.match(/(\d+)\s*(hour|minute|day)/i);
    if (match) {
        return { value: parseInt(match[1]), unit: match[2].toLowerCase() + 's' };
    }
    return { value: 2, unit: 'hours' };
}

export function composeSchedule(day: string, hour: number, minute: number) {
    return `Every ${day} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} UTC`;
}

export function composeDuration(value: number, unit: string) {
    return `${value} ${value === 1 ? unit.replace(/s$/, '') : unit}`;
}

export function getSeverityTag(severity: string) {
    switch (severity) {
        case 'critical': return React.createElement(Tag, { type: 'red', size: 'sm' }, 'CRITICAL');
        case 'major': return React.createElement(Tag, { type: 'magenta', size: 'sm' }, 'MAJOR');
        case 'warning': return React.createElement(Tag, { type: 'warm-gray', size: 'sm' }, 'WARNING');
        case 'info': return React.createElement(Tag, { type: 'blue', size: 'sm' }, 'INFO');
        default: return React.createElement(Tag, { type: 'gray', size: 'sm' }, severity.toUpperCase());
    }
}
