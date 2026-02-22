import type { TimestampInfo } from './formatTimestamp';
import { formatTimestamp } from './formatTimestamp';

/** Raw device shape that may come from the backend in various formats */
interface RawDeviceInput {
  name?: string;
  deviceName?: string;
  ip?: string;
  address?: string;
  icon?: string;
  type?: string;
  model?: string;
  vendor?: string;
  location?: string;
}

export function normalizeDevice(device: RawDeviceInput | string | null | undefined) {
  if (!device) return { name: 'Unknown', ip: '', icon: 'server', model: '', vendor: '' };
  if (typeof device === 'string') return { name: device, ip: '', icon: 'server', model: '', vendor: '' };
  return {
    name: device.name != null ? String(device.name) : (device.deviceName != null ? String(device.deviceName) : 'Unknown'),
    ip: device.ip != null ? String(device.ip) : (device.address != null ? String(device.address) : ''),
    icon: device.icon || device.type || 'server',
    model: device.model || '',
    vendor: device.vendor || '',
    location: device.location || undefined,
  };
}

export function normalizeAlert<T extends Record<string, unknown>>(a: T): T {
  const normalized = { ...(a || {}) } as Record<string, unknown>;
  try {
    normalized.timestamp = formatTimestamp(a.timestamp);
  } catch {
    normalized.timestamp = { absolute: '', relative: '' } as TimestampInfo;
  }

  try {
    normalized.device = normalizeDevice(a.device as RawDeviceInput | string | null | undefined);
  } catch {
    normalized.device = { name: 'Unknown', ip: '', icon: 'server', model: '', vendor: '' };
  }

  return normalized as T;
}

export default normalizeAlert;
