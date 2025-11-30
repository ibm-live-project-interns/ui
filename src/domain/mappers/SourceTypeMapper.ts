import type { AlertSourceType } from '../../models';

export interface SourceTypeInfo {
  label: string;
  icon: string;
}

export class SourceTypeMapper {
  private static instance: SourceTypeMapper;
  private mappings = new Map<AlertSourceType, SourceTypeInfo>([
    ['snmp_trap', { label: 'SNMP Trap', icon: 'network' }],
    ['syslog', { label: 'Syslog', icon: 'document' }],
  ]);

  static getInstance(): SourceTypeMapper {
    if (!this.instance) this.instance = new SourceTypeMapper();
    return this.instance;
  }

  map(sourceType: AlertSourceType): SourceTypeInfo {
    return this.mappings.get(sourceType) || { label: sourceType, icon: 'unknown' };
  }
}
