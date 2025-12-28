# UI Architecture

## Overview
This is a React + TypeScript application built with:
- **Vite** for bundling and dev server
- **Carbon Design System** for UI components
- **React Router** for client-side routing

## Project Structure

```
src/
├── __mocks__/           # Mock data (alerts, users, devices)
├── components/          # React components
├── config/              # Environment and API configuration
├── constants/           # Types, constants, and helpers
├── hooks/               # Custom React hooks
├── models/              # Backend API models (for reference)
├── pages/               # Page components
├── services/            # Data services (API + mock switching)
└── styles/              # SCSS styles
```

## Data Layer

### Mock vs API Switching

The application uses `AlertDataService` to abstract data fetching:

```typescript
import { alertDataService } from '@/services';

// Works with mock OR API based on env.useMockData
const alerts = await alertDataService.getAlerts();
```

**Environment-based switching:**
- **Development**: Uses mock data by default (`VITE_USE_MOCK !== 'false'`)
- **Production**: Uses real API by default (`VITE_USE_MOCK === 'true'` for demos)

**To force mock data in production:**
```bash
VITE_USE_MOCK=true npm run build
```

**To use real API in development:**
```bash
VITE_USE_MOCK=false npm run dev
```

### Adding a New API Endpoint

1. Add endpoint to `src/config/environment.ts`:
```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  MY_NEW_ENDPOINT: '/my-new-endpoint',
};
```

2. Add method to `IAlertDataService` interface and both implementations in `AlertDataService.ts`

3. Add mock data to `src/__mocks__/alerts.mock.ts`

## Types and Constants

All alert-related types are in `src/constants/alerts.tsx`:
- `Severity`, `AlertStatus`, `DeviceIcon`
- `SummaryAlert`, `PriorityAlert`, `DetailedAlert`
- `SEVERITY_CONFIG`, `STATUS_CONFIG`
- Helper functions: `getSeverityTag()`, `getStatusTag()`, etc.

```typescript
import { Severity, SEVERITY_CONFIG, getSeverityTag } from '@/constants';
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_USE_MOCK` | Use mock data | `true` in dev, `false` in prod |
| `VITE_API_BASE_URL` | API base URL | `http://localhost:8080` |
| `VITE_WS_ENDPOINT` | WebSocket URL | `ws://localhost:8080/ws` |
| `VITE_ENABLE_WEBSOCKET` | Enable WebSocket | `false` in dev, `true` in prod |

## CSS/SCSS

- Main entry: `src/styles/index.scss`
- Uses Carbon Design tokens (`$spacing-*`, `$text-*`, etc.)
- Theme switching via `data-theme-setting` attribute on `<html>`
