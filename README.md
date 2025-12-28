# Alert Visualization UI

A React application for viewing and managing network alerts with AI-generated insights. Built with [Carbon Design System](https://carbondesignsystem.com/).

## What This Does

Shows alerts from network devices (SNMP traps, syslogs) with AI-generated explanations and recommended actions. To make sense of network noise.

## Quick Start

```bash
npm install
npm run dev      # Development with mock data
npm run build    # Production build
```

## Project Structure

```
src/
├── __mocks__/      # Mock data for development
├── components/     # React components
├── config/         # Environment and API config
├── constants/      # Types, constants, helpers
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── services/       # Data services (mock/API)
└── styles/         # SCSS styles
```

## Data Layer

The app uses `AlertDataService` which automatically switches between mock and real API:

```typescript
import { alertDataService } from '@/services';

const alerts = await alertDataService.getAlerts();
```

**Environment switching:**
```bash
# Development: uses mock data by default
npm run dev

# Development with real API
VITE_USE_MOCK=false npm run dev

# Production: uses real API by default
npm run build

# Production demo with mock data
VITE_USE_MOCK=true npm run build
```

## Key Imports

```typescript
// Types and constants
import { Severity, SEVERITY_CONFIG, getSeverityTag } from '@/constants';

// Data service
import { alertDataService } from '@/services';

// Environment config
import { env, API_ENDPOINTS } from '@/config';
```

## Carbon Design System

Uses IBM Carbon components:
- `DataTable` for alert lists
- `Tag` for severity/status badges
- `Tile` for card layouts
- Carbon charts for visualizations

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Project structure and data layer
- [Developer Guide](./docs/DEVELOPER_GUIDE.md) - Common patterns and examples

## Tech Stack

- React 19 + TypeScript
- Vite
- Carbon Design System
- React Router
