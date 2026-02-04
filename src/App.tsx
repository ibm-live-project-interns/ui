import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Loading } from '@carbon/react';

// Providers
import { RoleProvider } from '@/features/roles/hooks';

// Layouts - keep these eager as they're needed immediately
import { AppLayout, AuthLayout, PublicLayout } from './components/layout';
import { ProtectedRoute } from './components/auth';

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


// Loading fallback component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#161616'
  }}>
    <Loading withOverlay={false} description="Loading..." />
  </div>
);

// Wrap lazy components with Suspense
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
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
        path: '*',
        element: withSuspense(NotFoundPage),
      },
    ],
  },
]);

function App() {
  return (
    <RoleProvider defaultRole="network-ops">
      <RouterProvider router={router} />
    </RoleProvider>
  );
}

export default App;

