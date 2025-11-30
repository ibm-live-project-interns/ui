import type { AlertSeverity, SeverityTagKind } from '../../models';

export interface SeverityInfo {
  label: string;
  kind: SeverityTagKind;
  priority: number;
}

export class SeverityMapper {
  private static instance: SeverityMapper;
  private mappings = new Map<AlertSeverity, SeverityInfo>([
    ['critical', { label: 'Critical', kind: 'red', priority: 1 }],
    ['high', { label: 'High', kind: 'magenta', priority: 2 }],
    ['medium', { label: 'Medium', kind: 'purple', priority: 3 }],
    ['low', { label: 'Low', kind: 'blue', priority: 4 }],
    ['info', { label: 'Info', kind: 'gray', priority: 5 }],
  ]);

  static getInstance(): SeverityMapper {
    if (!this.instance) this.instance = new SeverityMapper();
    return this.instance;
  }

  map(severity: AlertSeverity): SeverityInfo {
    return this.mappings.get(severity)!;
  }
}
