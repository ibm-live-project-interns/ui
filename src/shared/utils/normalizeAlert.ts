import type { TimestampInfo } from './formatTimestamp';
import { formatTimestamp } from './formatTimestamp';

export function normalizeDevice(device: any) {
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

export function normalizeAlert<T extends Record<string, any>>(a: T): T {
  const normalized: any = { ...(a || {}) };
  try {
    normalized.timestamp = formatTimestamp(a.timestamp);
  } catch (e) {
    normalized.timestamp = { absolute: '', relative: '' } as TimestampInfo;
  }

  try {
    normalized.device = normalizeDevice(a.device);
  } catch (e) {
    normalized.device = { name: 'Unknown', ip: '', icon: 'server', model: '', vendor: '' };
  }

  return normalized as T;
}

export default normalizeAlert;
