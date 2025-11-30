import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './components/layout';
import {
  HomePage,
  DashboardPage,
  AlertsPage,
  AlertDetailPage,
  NotFoundPage,
} from './pages';
import { bootstrapServices } from './core/di/bootstrap';

// Initialize DI container
bootstrapServices();

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'alerts',
        element: <AlertsPage />,
      },
      {
        path: 'alerts/:alertId',
        element: <AlertDetailPage />,
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
