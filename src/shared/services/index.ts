/**
 * Copyright IBM Corp. 2026
 *
 * Services Barrel Export
 *
 * Centralizes access to all feature services.
 * Import from '@/shared/services' for cleaner imports.
 */

// Alert services
export { alertDataService } from '../../features/alerts/services/alertService';

// Auth services
export { authService } from '../../features/auth/services/authService';

// Device services
export { deviceService } from '../../features/devices/services/deviceService';
export type { Device, DeviceDetails, DeviceStats, NoisyDevice, DeviceType, DeviceStatus } from '../../features/devices/services/deviceService';

// Ticket services
export { ticketDataService } from '../../features/tickets/services/ticketService';
export type { TicketInfo, CreateTicketData } from '../../features/tickets/services/ticketService';
