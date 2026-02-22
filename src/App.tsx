import { lazy, Suspense, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Loading, Button } from '@carbon/react';

// Providers
import { RoleProvider } from '@/features/roles/hooks';
import { ToastProvider } from '@/contexts';
import { logger } from '@/shared/utils/logger';

// Layouts - keep these eager as they're needed immediately
import { AppLayout, AuthLayout, PublicLayout } from './components/layout';
import { ProtectedRoute } from './components/auth';

// Auth service for RBAC checks
import { authService } from '@/features/auth/services/authService';

// Lazy load all pages - they'll be loaded on-demand
const WelcomePage = lazy(() => import('./pages/welcome').then(m => ({ default: m.WelcomePage })));
const DashboardPage = lazy(() => import('./pages/dashboard').then(m => ({ default: m.DashboardPage })));
const PriorityAlertsPage = lazy(() => import('./pages/alerts').then(m => ({ default: m.PriorityAlertsPage })));
const TrendsPage = lazy(() => import('./pages/trends').then(m => ({ default: m.TrendsPage })));
const TicketsPage = lazy(() => import('./pages/tickets').then(m => ({ default: m.TicketsPage })));
const TicketDetailsPage = lazy(() => import('./pages/tickets').then(m => ({ default: m.TicketDetailsPage })));
const SettingsPage = lazy(() => import('./pages/settings').then(m => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('./pages/not-found').then(m => ({ default: m.NotFoundPage })));
const LoginPage = lazy(() => import('./pages/auth').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth').then(m => ({ default: m.ForgotPasswordPage })));
const AlertDetailsPage = lazy(() => import('./pages/alerts').then(m => ({ default: m.AlertDetailsPage })));
const DeviceExplorerPage = lazy(() => import('./pages/devices').then(m => ({ default: m.DeviceExplorerPage })));
const DeviceDetailsPage = lazy(() => import('./pages/devices').then(m => ({ default: m.DeviceDetailsPage })));
const ConfigurationPage = lazy(() => import('./pages/configuration').then(m => ({ default: m.ConfigurationPage })));
const IncidentHistoryPage = lazy(() => import('./pages/incidents').then(m => ({ default: m.IncidentHistoryPage })));
const AuditLogPage = lazy(() => import('./pages/admin/AuditLogPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const ReportsHubPage = lazy(() => import('./pages/reports').then(m => ({ default: m.ReportsHubPage })));
const SLAReportsPage = lazy(() => import('./pages/reports/SLAReportsPage'));
const OnCallPage = lazy(() => import('./pages/oncall/OnCallPage'));
const TopologyPage = lazy(() => import('./pages/topology/TopologyPage'));
const RunbooksPage = lazy(() => import('./pages/runbooks/RunbooksPage'));
const DeviceGroupsPage = lazy(() => import('./pages/devices/DeviceGroupsPage'));
const ServiceStatusPage = lazy(() => import('./pages/service-status').then(m => ({ default: m.ServiceStatusPage })));
const PostMortemPage = lazy(() => import('./pages/incidents/PostMortemPage').then(m => ({ default: m.default || m.PostMortemPage })));

// ==========================================
// Error Boundary for lazy-loaded components
// ==========================================

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Route rendering error', error, errorInfo);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__description">
            An unexpected error occurred while loading this page. Please try reloading.
          </p>
          {this.state.error && (
            <p className="error-boundary__error-message">
              {this.state.error.message}
            </p>
          )}
          <Button kind="primary" onClick={this.handleReload} className="error-boundary__reload-btn">
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ==========================================
// Role-based route guard
// ==========================================

interface RequireRoleProps {
  allowedRoles: string[];
  children: ReactNode;
}

function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const user = authService.getCurrentUser();
  const userRole = user?.role || '';

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Loading fallback component
const PageLoader = () => (
  <div className="page-loader">
    <Loading withOverlay={false} description="Loading..." />
  </div>
);

// Wrap lazy components with Suspense and ErrorBoundary
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <RouteErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </RouteErrorBoundary>
);

const router = createBrowserRouter([
  // Public: Landing page
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: withSuspense(WelcomePage),
      },
    ],
  },

  // Public: Auth routes
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: withSuspense(LoginPage),
      },
      {
        path: 'register',
        element: withSuspense(RegisterPage),
      },
      {
        path: 'forgot-password',
        element: withSuspense(ForgotPasswordPage),
      },
    ],
  },

  // Protected: Dashboard & App routes
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: withSuspense(DashboardPage),
      },
      {
        path: 'priority-alerts',
        element: withSuspense(PriorityAlertsPage),
      },
      {
        path: 'alerts/:alertId',
        element: withSuspense(AlertDetailsPage),
      },
      {
        path: 'devices',
        element: withSuspense(DeviceExplorerPage),
      },
      {
        path: 'devices/:deviceId',
        element: withSuspense(DeviceDetailsPage),
      },
      {
        path: 'trends',
        element: withSuspense(TrendsPage),
      },
      {
        path: 'incident-history',
        element: withSuspense(IncidentHistoryPage),
      },
      {
        path: 'tickets',
        element: withSuspense(TicketsPage),
      },
      {
        path: 'tickets/:ticketId',
        element: withSuspense(TicketDetailsPage),
      },
      {
        path: 'settings',
        element: withSuspense(SettingsPage),
      },
      {
        path: 'configuration',
        element: withSuspense(ConfigurationPage),
      },
      {
        path: 'profile',
        element: withSuspense(ProfilePage),
      },
      {
        // Audit log restricted to sysadmin role
        path: 'admin/audit-log',
        element: (
          <RequireRole allowedRoles={['sysadmin']}>
            {withSuspense(AuditLogPage)}
          </RequireRole>
        ),
      },
      {
        path: 'reports',
        element: withSuspense(ReportsHubPage),
      },
      {
        path: 'reports/sla',
        element: withSuspense(SLAReportsPage),
      },
      {
        path: 'on-call',
        element: withSuspense(OnCallPage),
      },
      {
        path: 'topology',
        element: withSuspense(TopologyPage),
      },
      {
        path: 'device-groups',
        element: withSuspense(DeviceGroupsPage),
      },
      {
        path: 'runbooks',
        element: withSuspense(RunbooksPage),
      },
      {
        path: 'service-status',
        element: withSuspense(ServiceStatusPage),
      },
      {
        path: 'incidents/post-mortems',
        element: withSuspense(PostMortemPage),
      },
      {
        path: '*',
        element: withSuspense(NotFoundPage),
      },
    ],
  },
]);

function App() {
  return (
    <RoleProvider defaultRole="network-ops">
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </RoleProvider>
  );
}

export default App;
