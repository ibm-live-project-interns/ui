/**
 * Shared Types Index
 *
 * Single source of truth for all type definitions.
 * Import from '@/shared/types' for cleaner imports.
 *
 * API types mirror backend Go models exactly (snake_case).
 * Common types provide UI-specific extensions and display variants.
 */

// API types - mirrors backend models exactly (primary source)
export * from './api.types';

// Common types - UI extensions for display, icons, and derived types
// Note: Some types are intentionally re-exported from api.types as aliases
export {
    type Severity,
    type AlertStatus,
    type DeviceIcon,
    type SeverityDisplay,
    type StatusDisplay,
    type DeviceStatusDisplay,
    type DeviceInfo,
    type ExtendedDeviceInfo,
    type TimestampInfo,
    type NoisyDeviceUI,
} from './common.types';
