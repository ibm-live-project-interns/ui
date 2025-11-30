# Alert Visualization UI

A React app for viewing and managing network alerts in real-time. Built with [Carbon Design System](https://carbondesignsystem.com/) by IBM.

## What This Does

Shows alerts from network devices (SNMP traps, syslogs) with AI-generated explanations and recommended actions. To make sense of network noise.

## Running It

```bash
# Install stuff
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## How It's Organized

The code is split into layers - each layer has a specific job:

```
src/
├── core/           # Basic building blocks (interfaces, DI container, error handling)
├── domain/         # Business logic (how alerts work, data transformations)
├── infrastructure/ # Talking to APIs and external stuff
├── application/    # App-level logic (state management, custom hooks)
├── presentation/   # UI stuff (components, pages, viewmodels)
└── __mocks__/      # Mock data for development
```

## Key Concepts

### ViewModels
These prepare data for display. Instead of formatting dates and labels in every component, we do it once in a ViewModel.

```typescript
import { AlertViewModel } from '@/presentation/viewmodels';

const vm = new AlertViewModel(alert);
console.log(vm.severityLabel);  // "Critical"
console.log(vm.relativeTime);   // "2 hours ago"
```

### Factories
These create objects consistently. Handles messy API responses so you don't have to.

```typescript
import { alertFactory } from '@/domain/factories';

// Handles snake_case, camelCase, missing fields, etc.
const alert = alertFactory.createFromApiResponse(apiData);
```

### Mappers
Convert data to UI-friendly formats. One place to change labels/colors for everything.

```typescript
import { severityMapper } from '@/domain/mappers';

const info = severityMapper.getSeverityInfo('critical');
// { label: 'Critical', kind: 'red', priority: 1 }
```

### State Management
Uses React Context + Reducer. Like Redux but simpler.

```typescript
import { useAlerts } from '@/application/hooks';

const { alerts, loading, applyFilters } = useAlerts();
```

### Dependency Injection
Services are injected instead of imported directly. Makes testing easier.

```typescript
import { useService } from '@/application/hooks';
import { ServiceTokens } from '@/core/di';

const alertService = useService(ServiceTokens.AlertService);
```

## Carbon Design System

We use IBM's Carbon components throughout. Check their docs for component usage:
- [Carbon Design Guidelines](https://carbondesignsystem.com/)

Main components we use (for now):
- `DataTable` for alert lists
- `Tag` for severity/status badges
- `Tile` for card layouts
- `Button`, `Search`, `Modal` for interactions

## Adding New Features

### New Alert Property
1. Add to `models/Alert.ts`
2. Update `AlertFactory` if it comes from API
3. Add to `AlertViewModel` if it needs formatting
4. Use in components

### New Page
1. Create in `presentation/pages/`
2. Add route in `App.tsx`
3. Use existing hooks and ViewModels

### New Service
1. Define interface in `core/interfaces/`
2. Implement in `infrastructure/services/`
3. Register in `core/di/bootstrap.ts`
4. Use via `useService` hook

## Good Practices

### Feature Flags
Use environment variables to toggle features. This lets you develop with mock data and deploy with real APIs.

```typescript
// In your component
if (import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
  alertService.useMockStrategy();
} else {
  alertService.useApiStrategy();
}
```

Available flags in `.env`:
- `VITE_ENABLE_MOCK_DATA` - Use mock data instead of API
- `VITE_ENABLE_WEBSOCKET` - Enable real-time updates
- `VITE_ENABLE_TICKETING` - Enable ticketing integration

### Strategy Pattern for Data Sources
Switch between mock and real data without changing component code.

```typescript
// Development: use mock data
alertService.useMockStrategy();

// Production: use real API
alertService.useApiStrategy();
```

See `src/examples/StrategyPattern.example.tsx` for full examples.

### Dependency Injection
Inject services instead of importing them directly. Makes testing and swapping implementations easy.

```typescript
// ❌ Don't do this
import { alertService } from '@/services';

// ✅ Do this
const alertService = useService(ServiceTokens.AlertService);
```

See `src/examples/AlertListWithDI.example.tsx` for usage.

### ViewModels for Presentation Logic
Keep formatting logic out of components. One place to change, everywhere updates.

```typescript
// ❌ Don't do this in every component
<Tag kind={alert.severity === 'critical' ? 'red' : 'blue'}>
  {alert.severity.toUpperCase()}
</Tag>

// ✅ Do this
const vm = new AlertViewModel(alert);
<Tag kind={vm.severityKind}>{vm.severityLabel}</Tag>
```

### Error Boundaries
Wrap async operations to handle errors gracefully.

```typescript
const data = await withErrorBoundary(
  async () => await fetchData(),
  { context: 'fetchData', defaultValue: [] }
);
```

See `src/examples/ErrorHandling.example.ts` for patterns.

## Docs

- [Developer Guide](./docs/DEVELOPER_GUIDE.md) - Common tasks, patterns, and examples
- [Dependency Injection](./docs/DEPENDENCY_INJECTION.md) - How DI works here

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Carbon Design System (UI components)
- React Router (navigation)

## Notes

- Mock data is in `__mocks__/` - switch to real API by calling `alertService.useApiStrategy()`
- All dates are handled by ViewModels - don't format them in components
- Error handling is centralized - wrap async calls with `withErrorBoundary`
- State is managed globally - use hooks instead of local state when possible
- Check `src/examples/` for working code examples
