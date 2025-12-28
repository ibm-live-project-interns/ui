// Pages barrel export
export { WelcomePage } from './welcome';
export { DashboardPage } from './dashboard';
export { PriorityAlertsPage } from './priority-alerts';
export { SettingsPage } from './settings';
export { NotFoundPage } from './not-found';

// Auth pages
export { LoginPage, RegisterPage, ForgotPasswordPage } from './auth';

// Alert pages (re-exported from components since AlertDetailsPage is a component)
export { AlertDetailsPage } from '../components/alerts';
