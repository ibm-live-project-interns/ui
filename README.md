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
| Development | http://localhost:5173 | Mock data | Any credentials |
| Production | http://localhost:3000 | Real API | `admin` / `admin123` (any works) |

**Demo Login:** The application accepts any non-empty username and password for demonstration. Try `admin` / `admin123`.

## Project Structure

```
src/
├── __mocks__/          # Mock data for development
├── components/         # React components
│   ├── alerts/         # Alert-specific components
│   ├── auth/           # Authentication
│   ├── common/         # Common UI elements
│   ├── dashboard/      # Dashboard components
│   ├── layout/         # App layout (Header, Sidebar)
│   └── shared/         # Reusable components (KPICard, etc.)
├── config/             # Environment configuration
├── constants/          # Types, constants, helpers
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── dashboard/
│   ├── priority-alerts/
│   ├── tickets/
│   ├── ticket-details/
│   └── trends-insights/
├── services/           # Data services (API/Mock)
└── styles/             # SCSS styles
```

## Key Features

- **Dashboard** - Real-time overview with KPIs and charts
- **Priority Alerts** - Filter and manage critical alerts
- **Alert Details** - AI analysis with root causes and recommendations
- **Tickets** - Issue tracking system
- **Trends & Insights** - Historical analysis and patterns

## Data Layer

The app uses `AlertDataService` which automatically switches between mock and real API:

```typescript
import { alertDataService } from '@/services';

// Works with mock OR API based on VITE_USE_MOCK
const alerts = await alertDataService.getAlerts();
const summary = await alertDataService.getAlertsSummary();
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_USE_MOCK` | `true` (dev) | Use mock data |
| `VITE_API_BASE_URL` | `http://localhost:8080` | API base URL |
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

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run format    # Format with Prettier
```
