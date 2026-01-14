import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Loading } from '@carbon/react';

// Layouts - keep these eager as they're needed immediately
import { AppLayout, AuthLayout, PublicLayout } from './components/layout';
import { ProtectedRoute } from './components/auth';

// Lazy load all pages - they'll be loaded on-demand
const WelcomePage = lazy(() => import('./pages/welcome').then(m => ({ default: m.WelcomePage })));
const DashboardPage = lazy(() => import('./pages/dashboard').then(m => ({ default: m.DashboardPage })));
const PriorityAlertsPage = lazy(() => import('./pages/priority-alerts').then(m => ({ default: m.PriorityAlertsPage })));
const TrendsAndInsightsPage = lazy(() => import('./pages/trends-insights').then(m => ({ default: m.TrendsAndInsightsPage })));
const TicketsPage = lazy(() => import('./pages/tickets').then(m => ({ default: m.TicketsPage })));
const TicketDetailsPage = lazy(() => import('./pages/ticket-details').then(m => ({ default: m.TicketDetailsPage })));
const SettingsPage = lazy(() => import('./pages/settings').then(m => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('./pages/not-found').then(m => ({ default: m.NotFoundPage })));
const LoginPage = lazy(() => import('./pages/auth/login').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/register').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/forgot-password').then(m => ({ default: m.ForgotPasswordPage })));
const AlertDetailsPage = lazy(() => import('./components/alerts/AlertDetailsPage').then(m => ({ default: m.AlertDetailsPage })));

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
        path: 'trends',
        element: withSuspense(TrendsAndInsightsPage),
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
        path: '*',
        element: withSuspense(NotFoundPage),
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
