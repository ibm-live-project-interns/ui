/**
 * Dashboard Page
 *
 * Smart router that displays the appropriate dashboard view based on user role.
 */

import { useRole } from '@/features/roles/hooks';
import { NetworkOpsView } from './views/NetworkOpsView';
import { SREView } from './views/SREView';
import { NetworkAdminView } from './views/NetworkAdminView';
import { SeniorEngineerView } from './views/SeniorEngineerView';
import { SysAdminView } from './views/SysAdminView';

export function DashboardPage() {
    const { currentRole } = useRole();

    const dashboardViews = {
        'network-ops': NetworkOpsView,
        'sre': SREView,
        'network-admin': NetworkAdminView,
        'senior-eng': SeniorEngineerView,
        'sysadmin': SysAdminView,
    };

    const DashboardView = dashboardViews[currentRole.dashboardView];

    // All views now accept config prop (placeholders handle missing data internally)
    return <DashboardView config={currentRole} />;
}

export default DashboardPage;
