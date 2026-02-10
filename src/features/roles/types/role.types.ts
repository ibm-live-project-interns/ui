/**
 * Role Types
 *
 * Type definitions for the role-based dashboard system.
 */

// ==========================================
// Role Type Definitions
// ==========================================

export type RoleId = 'network-ops' | 'sre' | 'network-admin' | 'senior-eng' | 'sysadmin';
export type Permission =
    | 'view-alerts'
    | 'acknowledge-alerts'
    | 'create-tickets'
    | 'view-devices'
    | 'manage-devices'
    | 'view-config'
    | 'view-analytics'
    | 'export-reports'
    | 'view-services'
    | 'view-sla'
    | 'view-all'
    | 'view-team-metrics'
    | 'view-tickets';

export type SidebarItem =
    | 'dashboard'
    | 'priority-alerts'
    | 'alerts'
    | 'tickets'
    | 'devices'
    | 'topology'
    | 'configuration'
    | 'incidents'
    | 'services'
    | 'sla-reports'
    | 'trends'
    | 'settings';

// ==========================================
// Configuration Interfaces
// ==========================================

export interface KPIConfig {
    id: string;
    label: string;
    priority: number;
}

export interface ChartConfig {
    id: string;
    type: 'area' | 'line' | 'bar' | 'donut' | 'gauge';
    title: string;
}

export interface TableConfig {
    id: string;
    title: string;
    columns: string[];
}

export interface WidgetConfig {
    id: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

export interface RoleConfig {
    id: RoleId;
    name: string;
    description: string;
    dashboardView: RoleId;
    kpis: KPIConfig[];
    charts: ChartConfig[];
    tables: TableConfig[];
    widgets: WidgetConfig[];
    sidebarItems: SidebarItem[];
    permissions: Permission[];
}

export interface Role {
    id: RoleId;
    name: string;
    description: string;
}
