import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout, AuthLayout, PublicLayout } from './components/layout';
import {
  WelcomePage,
  NotFoundPage,
  DashboardPage,
  PriorityAlertsPage,
  SettingsPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  AlertDetailsPage,
} from './pages';


const router = createBrowserRouter([
  // Auth routes (header only, no sidebar)
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
    ],
  },
  // Public routes (home page - header only, no sidebar)
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <WelcomePage />,
      },
    ],
  },
  // Main app routes (with sidebar and header)
  {
    element: <AppLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'priority-alerts',
        element: <PriorityAlertsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'alerts/:alertId',
        element: <AlertDetailsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
