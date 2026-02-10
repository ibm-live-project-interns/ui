# Alert Visualization UI

A React application for viewing and managing network alerts with AI-generated insights. Built with [Carbon Design System](https://carbondesignsystem.com/).

## What This Does

Shows alerts from network devices (SNMP traps, syslogs) with AI-generated explanations and recommended actions. To make sense of network noise.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (uses mock data)
npm run dev

# Start with real API
VITE_USE_MOCK=false npm run dev

# Production build
npm run build
```

## Access Points

| Mode | URL | Data Source | Login |
|------|-----|-------------|-------|
| Development | http://localhost:5173 | Mock data | See credentials below |
| Production | http://localhost:3000 | Real API | See credentials below |

## User Credentials (Role-Based Dashboards)

The application features **role-based dashboards** - each user role sees a customized dashboard with relevant KPIs and features.

| Role | Username | Password | Dashboard Features |
|------|----------|----------|-------------------|
| **Network Operations** | `netops` | `netops123` | Alert monitoring, severity distribution, recent alerts, noisy devices |
| **Site Reliability Engineer** | `sre` | `sre123` | MTTR metrics, availability, incident trends, service health |
| **Network Administrator** | `netadmin` | `netadmin123` | Device inventory, health status, CPU/memory usage, config changes |
| **Senior Engineer** | `senior` | `senior123` | Advanced analytics, AI insights, pattern analysis, correlation matrix |

**Demo Mode:** For quick testing, any credentials work, and you'll default to Network Operations dashboard. The role persists in localStorage and can be changed in Settings.

### Role Permissions

| Permission | Network Ops | SRE | Network Admin | Senior Eng |
|------------|-------------|-----|---------------|------------|
| View Alerts | ✅ | ✅ | ✅ | ✅ |
| Acknowledge Alerts | ✅ | ✅ | ❌ | ✅ |
| Create Tickets | ✅ | ✅ | ❌ | ✅ |
| View Devices | ✅ | ✅ | ✅ | ✅ |
| Manage Devices | ❌ | ❌ | ✅ | ✅ |
| View Analytics | ❌ | ✅ | ❌ | ✅ |
| Export Reports | ❌ | ✅ | ✅ | ✅ |

## Project Structure

```
src/
├── app/                # App-wide providers and routing
│   ├── providers/      # Context providers
│   └── routes/         # Route definitions
├── components/         # React components
│   ├── auth/           # Authentication components
│   ├── feedback/       # Loading, error states
│   ├── layout/         # App layout (Header, Sidebar)
│   ├── ui/             # Reusable UI (KPICard, ChartWrapper, etc.)
│   └── widgets/        # Dashboard widgets
├── features/           # Feature-specific logic
│   ├── alerts/         # Alert services, hooks, types
│   ├── auth/           # Authentication logic
│   ├── devices/        # Device management logic
│   ├── roles/          # Role-based access control
│   └── tickets/        # Ticket management logic
├── pages/              # Page views
│   ├── alerts/         # Priority Alerts & Details
│   ├── auth/           # Login, Register
│   ├── configuration/  # App configuration
│   ├── dashboard/      # Role-based dashboards
│   ├── devices/        # Device Explorer & Details
│   ├── not-found/      # 404 Page
│   ├── settings/       # User settings
│   ├── tickets/        # Ticket list & details
│   ├── trends/         # Trends & Insights
│   └── welcome/        # Landing page
├── shared/             # Shared utilities
│   ├── api/            # HTTP client
│   ├── config/         # App configuration
│   ├── constants/      # App constants
│   ├── services/       # Shared services
│   ├── types/          # Shared types
│   └── utils/          # Helper functions
└── styles/             # Global styles ("_*.scss")
```

## Key Features

- **Role-Based Dashboards** - Customized dashboards for each user role (Network Ops, SRE, Network Admin, Senior Engineer)
- **Real-Time Monitoring** - Live alert updates with severity-based KPIs
- **Priority Alerts** - Advanced filtering, search, and bulk actions
- **Alert Details** - AI-powered analysis with root causes and recommendations
- **Tickets** - Integrated issue tracking system
- **Trends & Insights** - Historical analysis, patterns, and AI insights
- **Device Management** - Health monitoring and configuration tracking (Network Admin role)
- **Analytics Dashboard** - Pattern detection and correlation analysis (Senior Engineer role)
**Data Service:**
```typescript
import { alertDataService } from '@/features/alerts/services/alertService';

const alerts = await alertDataService.getAlerts();
const summary = await alertDataService.getAlertsSummary();
```

**Role System:**
```typescript
import { useRole } from '@/features/roles/hooks';

function MyComponent() {
  const { currentRole, hasPermission } = useRole();

  if (hasPermission('manage-devices')) {
    // Show device management UI
  }

  console.log(currentRole.displayName); // "Network Operations"
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_USE_MOCK_DATA` | `true` (dev) | Use mock data |
| `VITE_API_URL` | `http://localhost:8080` | API base URL |
| `VITE_ENABLE_WEBSOCKET` | `false` | Enable WebSocket |

## Docker

### Full Stack Deployment

```bash
# Start all services (requires ingestor repo cloned alongside)
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Access Points (Docker)

| Service | URL | Credentials |
|---------|-----|-------------|
| UI | http://localhost:3000 | `admin` / `admin123` (any password works) |
| API | http://localhost:8080/api/v1 | JWT Auth (Direct access) |
| PgAdmin | http://localhost:5050 | admin@admin.com / root |
| Kafka UI | http://localhost:8090 | - |

**Note:** When using the web UI at port 3000, nginx proxies API requests to the backend at port 8080.

### Using PgAdmin

1. Open http://localhost:5050
2. Login: `admin@admin.com` / `root`
3. Server "NOC Database" is pre-configured (password: `secret` if prompted)
4. Browse: Servers → NOC Database → Databases → noc_alerts → Schemas → public → Tables

### Troubleshooting

If database tables are missing on first run:
```bash
# Reset and recreate database
docker compose down -v
docker compose up -d --build
```

## Documentation

Full documentation is in the [docs repository](https://github.com/ibm-live-project-interns/docs):

- [UI Screens & Components](https://github.com/ibm-live-project-interns/docs/blob/main/docs/UI_SCREENS.md) - Complete UI guide with code examples
- [API Reference](https://github.com/ibm-live-project-interns/docs/blob/main/docs/API.md) - REST API documentation
- [Architecture](https://github.com/ibm-live-project-interns/docs/blob/main/docs/ARCHITECTURE.md) - System design
- [Environment Config](https://github.com/ibm-live-project-interns/docs/blob/main/docs/ENVIRONMENT.md) - All environment variables
- [Deployment](https://github.com/ibm-live-project-interns/docs/blob/main/docs/DEPLOYMENT.md) - Deployment guide

**Offline Access:** If you have all repos cloned side-by-side, docs are at `../docs/docs/`

## Related Repositories

| Repository | Description |
|------------|-------------|
| [docs](https://github.com/ibm-live-project-interns/docs) | Documentation |
| [ingestor](https://github.com/ibm-live-project-interns/ingestor) | Backend services |
| [datasource](https://github.com/ibm-live-project-interns/datasource) | Data simulation |
| [infra](https://github.com/ibm-live-project-interns/infra) | Infrastructure |

## Tech Stack

- React 19 + TypeScript
- Vite
- IBM Carbon Design System
- Carbon Charts
- React Router
- SCSS

## E2E Testing (Playwright)

The project includes a comprehensive Playwright test suite for all major features.

```bash
# Run all tests against Docker (port 3000)
npm test

# Run against local dev server
BASE_URL=http://localhost:5173 npm test

# Run specific suites
npm run test:config         # Configuration page
npm run test:tickets        # Tickets page
npm run test:validation     # Input validation

# Run with visible browser
npm run test:headed

# View HTML test report
npm run test:report
```

### Test Files

| File | Tests | Covers |
|------|-------|--------|
| `tests/configuration.spec.ts` | 10 | CRUD for rules, channels, policies, maintenance windows |
| `tests/tickets.spec.ts` | 9 | Ticket create/edit, alert linking, assignee dropdown |
| `tests/input-validation.spec.ts` | 11 | Structured inputs, required field validation across all modals |

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run format    # Format with Prettier
npm test          # Run Playwright E2E tests
npm run test:headed  # Run tests with visible browser
```
