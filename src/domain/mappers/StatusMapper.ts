import type { AlertStatus } from '../../models';

export interface StatusInfo {
  label: string;
  color: string;
  isActive: boolean;
}

export class StatusMapper {
  private static instance: StatusMapper;
  private mappings = new Map<AlertStatus, StatusInfo>([
    ['active', { label: 'Active', color: 'red', isActive: true }],
    ['acknowledged', { label: 'Acknowledged', color: 'yellow', isActive: true }],
    ['resolved', { label: 'Resolved', color: 'green', isActive: false }],
    ['dismissed', { label: 'Dismissed', color: 'gray', isActive: false }],
  ]);

  static getInstance(): StatusMapper {
    if (!this.instance) this.instance = new StatusMapper();
    return this.instance;
  }

  map(status: AlertStatus): StatusInfo {
    return this.mappings.get(status)!;
  }
}
