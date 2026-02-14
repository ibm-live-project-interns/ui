# Sentrix UI

A React frontend for Sentrix for viewing and managing network alerts with AI-generated insights. Built with [Carbon Design System](https://carbondesignsystem.com/).

## What This Does

Shows alerts from network devices (SNMP traps, syslogs) with AI-generated explanations and recommended actions. To make sense of network noise.

## Tech Stack

| Dependency | Version |
|-----------|---------|
| React | 19.2.0 |
| TypeScript | 5.9.3 |
| Vite | 7.2.4 |
| @carbon/react | 1.97.0 |
| @carbon/charts-react | 1.27.0 |
| React Router | 7.9.6 |
| Sass | 1.97.1 |
| Playwright | 1.58.1 |

## Quick Start

```bash
# Install dependencies
npm install

# Dev server with mock data (port 5173)
npm run dev

# Dev server with real API
VITE_USE_MOCK=false npm run dev

# Production build
npm run build
```

## Access Points

| Mode | URL | Credentials |
|------|-----|-------------|
| Development | http://localhost:5173 | Any credentials (demo mode) |
| Docker/Prod | http://localhost:3000 | `admin@admin.com` / `admin123` |

In Docker, nginx proxies `/api/*` from port 3000 to the API Gateway at port 8080.

## Roles (5)

Role is selected at login and persists in localStorage. Changeable in Settings.

| Role ID | Display Name | Key Permissions |
|---------|-------------|-----------------|
| `network-ops` | NOC Operator | View/acknowledge alerts, create tickets |
| `sre` | Site Reliability Engineer | View analytics, export reports, MTTR metrics |
| `network-admin` | Network Administrator | Manage devices, device groups, export reports |
| `senior-eng` | Senior Engineer | Full analytics, AI insights, pattern analysis |
| `sysadmin` | System Administrator | User management, audit logs, full admin access |

## Pages

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/dashboard` | DashboardPage | Role-based dashboard (5 views: NetworkOps, SRE, NetworkAdmin, SeniorEng, SysAdmin) |
| `/priority-alerts` | PriorityAlertsPage | Alert table with filters, bulk actions, CSV export |
| `/alerts/:id` | AlertDetailsPage | AI analysis, root causes, raw trap data, device info |
| `/tickets` | TicketsPage | Ticket list with create/edit, dynamic assignees |
| `/tickets/:id` | TicketDetailsPage | Ticket detail with comments, status change, delete |
| `/devices` | DeviceExplorerPage | Device inventory with health scores, filtering |
| `/devices/:id` | DeviceDetailsPage | Device metrics charts, real API data, period selector |
| `/device-groups` | DeviceGroupsPage | Device group management (create, assign devices) |
| `/trends` | TrendsPage | Alert trends, recurring alerts, AI insights, peak hours |
| `/incident-history` | IncidentHistoryPage | Resolved incidents, MTTR, SLA, root cause charts |
| `/reports` | ReportsHubPage | 5 report types, CSV download, download history |
| `/reports/sla` | SLAReportsPage | SLA compliance, trend chart, violations table |
| `/on-call` | OnCallPage | Current on-call, weekly schedule, overrides |
| `/topology` | TopologyPage | Network topology visualization, connections table |
| `/configuration` | ConfigurationPage | Threshold rules, channels, policies, maintenance windows |
| `/runbooks` | RunbooksPage | Knowledge base CRUD, category filter, step editor |
| `/service-status` | ServiceStatusPage | Docker container monitoring, log viewer |
| `/admin/audit-log` | AuditLogPage | Audit log with KPIs, filters, CSV export (sysadmin) |
| `/settings` | SettingsPage | Theme, notifications, role selection |
| `/profile` | ProfilePage | Account details, password change |
| `/login` | LoginPage | Email/password + Google OAuth |
| `/register` | RegisterPage | Account registration |
| `/forgot-password` | ForgotPasswordPage | Password reset |
| `/welcome` | WelcomePage | Landing page |

## Project Structure

```
ui/src/
├── app/                    # Providers and routing
│   ├── providers/          # AuthProvider, RoleProvider, ThemeProvider, ToastProvider
│   └── routes/             # Route definitions
├── components/
│   ├── auth/               # ProtectedRoute, AuthGuard
│   ├── feedback/           # Loading, error states
│   ├── layout/             # AppHeader (sidebar nav), AppLayout
│   ├── ui/                 # Shared components:
│   │   ├── AlertTicker/    # Critical alert ticker with auto-rotation
│   │   ├── ChartWrapper    # Carbon Charts wrapper
│   │   ├── DataTableWrapper/ # Carbon DataTable wrapper
│   │   ├── EmptyState/     # Empty state (3 sizes: sm/md/lg)
│   │   ├── FilterBar/      # Reusable filter toolbar
│   │   ├── KPICard/        # Metric card with icon, trend, badge
│   │   ├── KPIRow          # KPI card row layout
│   │   ├── NoisyDevicesCard # Top alerting devices
│   │   ├── PageHeader/     # Page header with breadcrumbs, actions
│   │   └── WidgetErrorBoundary # Chart error boundary
│   └── widgets/            # Dashboard widgets
├── features/
│   ├── alerts/             # alertService (mock + API), hooks, types
│   ├── auth/               # authService, JWT handling
│   ├── devices/            # deviceService, hooks
│   ├── roles/              # RBAC (5 roles, 13 permissions)
│   └── tickets/            # ticketService, types
├── pages/                  # 18 page directories (listed above)
│   ├── admin/              # AuditLogPage
│   ├── alerts/             # PriorityAlertsPage, AlertDetailsPage + sub-components
│   ├── auth/               # login, register, forgot-password
│   ├── configuration/      # ConfigurationPage (4 tabs)
│   ├── dashboard/          # DashboardPage + views/ (5 role-based views)
│   ├── devices/            # DeviceExplorerPage, DeviceDetailsPage, DeviceGroupsPage
│   ├── incidents/          # IncidentHistoryPage
│   ├── oncall/             # OnCallPage
│   ├── profile/            # ProfilePage
│   ├── reports/            # ReportsHubPage, SLAReportsPage
│   ├── runbooks/           # RunbooksPage
│   ├── service-status/     # ServiceStatusPage
│   ├── settings/           # SettingsPage + RoleSelector
│   ├── tickets/            # TicketsPage, TicketDetailsPage
│   ├── topology/           # TopologyPage
│   ├── trends/             # TrendsPage
│   └── welcome/            # WelcomePage
├── shared/
│   ├── api/                # HTTP client (Axios)
│   ├── config/             # api.config.ts (54 endpoint constants)
│   ├── constants/          # routes.ts (25 routes), charts.ts, alerts.tsx
│   ├── contexts/           # ToastContext (shared toast notifications)
│   ├── services/           # userService
│   ├── types/              # Shared TypeScript types
│   └── utils/              # formatters, helpers
└── styles/                 # SCSS (21 page/component stylesheets)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_USE_MOCK` | `true` (dev) / `false` (prod) | Use mock data instead of real API |
| `VITE_API_BASE_URL` | `http://localhost:8080` | API Gateway base URL |
| `VITE_API_VERSION` | `v1` | API version prefix |
| `VITE_API_TIMEOUT` | `30000` | Request timeout (ms) |
| `VITE_ENABLE_WEBSOCKET` | `false` | Enable WebSocket connection |
| `VITE_ALERT_POLLING_INTERVAL` | `30000` | Alert refresh interval (ms) |
| `VITE_DASHBOARD_REFRESH_INTERVAL` | `30000` | Dashboard refresh interval (ms) |
| `VITE_DEFAULT_THEME` | `system` | Default theme: `light`, `dark`, `system` |

## Key Patterns

**Service layer** (mock/API switching):
```typescript
import { alertDataService } from '@/features/alerts/services/alertService';

// Automatically uses mock or real API based on VITE_USE_MOCK
const alerts = await alertDataService.getAlerts();
```

**Role system**:
```typescript
import { useRole } from '@/features/roles/hooks';

const { currentRole, hasPermission } = useRole();
if (hasPermission('manage-devices')) { /* ... */ }
```

**Theme detection** (MutationObserver on `data-theme-setting`):
```typescript
const observer = new MutationObserver(() => {
    const theme = document.documentElement.getAttribute('data-theme-setting');
    setCurrentTheme(theme === 'dark' ? 'g100' : 'white');
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-setting'] });
```

**Chart options** (Carbon Charts):
```typescript
import { createAreaChartOptions, createDonutChartOptions } from '@/shared/constants/charts';
const options = createAreaChartOptions({ title: 'Alerts Over Time', theme: currentTheme });
```

## Docker

```bash
# Full stack (from infra/prod/)
cd infra/prod && docker compose up -d --build

# UI only
docker compose build ui && docker compose up -d ui
```

Access at http://localhost:3000 (nginx proxies API to :8080).

## E2E Testing (Playwright)

```bash
npm test                    # Run against Docker (port 3000)
BASE_URL=http://localhost:5173 npm test  # Against dev server
npm run test:config         # Configuration page tests
npm run test:tickets        # Ticket tests
npm run test:validation     # Input validation tests
npm run test:headed         # With visible browser
npm run test:report         # View HTML report
```

| Test Suite | Tests | Coverage |
|-----------|-------|---------|
| `tests/configuration.spec.ts` | 10 | CRUD for rules, channels, policies, maintenance |
| `tests/tickets.spec.ts` | 9 | Create/edit, alert linking, assignee dropdown |
| `tests/input-validation.spec.ts` | 11 | Structured inputs, required field validation |

## Scripts

```bash
npm run dev           # Vite dev server (:5173)
npm run build         # Production build
npm run preview       # Preview production build
npm run lint          # ESLint
npm run format        # Prettier
npm test              # Playwright E2E
npm run test:headed   # E2E with visible browser
```
