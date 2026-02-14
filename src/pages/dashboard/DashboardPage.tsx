/**
 * Dashboard Page
 *
 * Displays the appropriate dashboard view based on user role.
 */

import { useRole } from '@/features/roles/hooks';
import { ROLE_CONFIGS } from '@/features/roles/config/roleConfig';
import type { RoleId } from '@/features/roles/types/role.types';
import { NetworkOpsView } from './views/NetworkOpsView';
import { SREView } from './views/SREView';
import { NetworkAdminView } from './views/NetworkAdminView';
import { SeniorEngineerView } from './views/SeniorEngineerView';
import { SysAdminView } from './views/SysAdminView';

const dashboardViews: Record<string, React.ComponentType<any>> = {
    'network-ops': NetworkOpsView,
    'sre': SREView,
    'network-admin': NetworkAdminView,
    'senior-eng': SeniorEngineerView,
    'sysadmin': SysAdminView,
};

export function DashboardPage() {
    const { currentRole } = useRole();

    const viewId = currentRole.dashboardView as RoleId;
    const DashboardView = dashboardViews[viewId] ?? SysAdminView;
    const config = ROLE_CONFIGS[viewId] ?? ROLE_CONFIGS['sysadmin'];

    return <DashboardView config={config} />;
}

export default DashboardPage;
