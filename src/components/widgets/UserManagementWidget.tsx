/**
 * Copyright IBM Corp. 2026
 *
 * UserManagementWidget - User stats mini-view for sysadmin.
 * Shows total/active/locked counts with a link to full admin.
 * Extracted from SysAdminView user management section.
 */

import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile, Button, Tag } from '@carbon/react';
import { UserMultiple, Security } from '@carbon/icons-react';
import { useFetchData } from '@/shared/hooks';
import { userService } from '@/shared/services';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';

interface UserManagementWidgetProps {
  className?: string;
}

export const UserManagementWidget = memo(function UserManagementWidget({ className }: UserManagementWidgetProps) {
  const navigate = useNavigate();

  const { data: users, isLoading, error, refetch } = useFetchData(
    async () => userService.getUsers(),
    []
  );

  const stats = useMemo(() => {
    if (!users) return { total: 0, active: 0, locked: 0, roles: {} as Record<string, number> };

    const active = users.filter(u => u.is_active).length;
    const locked = users.filter(u => !u.is_active).length;
    const roles: Record<string, number> = {};
    users.forEach(u => {
      const role = u.role || 'unknown';
      roles[role] = (roles[role] || 0) + 1;
    });

    return { total: users.length, active, locked, roles };
  }, [users]);

  if (isLoading && !users) return <WidgetSkeleton variant="compact" className={className} />;
  if (error && !users) return <WidgetError message={error} onRetry={refetch} className={className} />;

  return (
    <div className={`widget widget--user-management ${className || ''}`}>
      <Tile className="widget__tile">
        <div className="widget__header">
          <h3>
            <UserMultiple size={18} />
            User Management
          </h3>
          <Button kind="ghost" size="sm" onClick={() => navigate('/admin/audit-log')}>
            Audit Log
          </Button>
        </div>

        <div className="user-stat-grid">
          <div className="user-stat">
            <div className="user-stat__value">{stats.total}</div>
            <div className="user-stat__label">Total Users</div>
          </div>
          <div className="user-stat">
            <div className="user-stat__value user-management__active-value">{stats.active}</div>
            <div className="user-stat__label">Active</div>
          </div>
          <div className="user-stat">
            <div className={`user-stat__value ${stats.locked > 0 ? 'user-stat__value--error' : 'user-stat__value--muted'}`}>
              {stats.locked}
            </div>
            <div className="user-stat__label">Locked</div>
          </div>
        </div>

        <div className="widget__body">
          <div className="user-management__roles-heading">
            <Security size={14} className="user-management__roles-icon" />
            Roles Distribution
          </div>
          <div className="user-management__roles-grid">
            {Object.entries(stats.roles).map(([role, count]) => {
              const tagType = role === 'sysadmin' ? 'red'
                : role === 'network-ops' ? 'blue'
                : role === 'sre' ? 'cyan'
                : role === 'senior-eng' ? 'purple'
                : role === 'network-admin' ? 'teal'
                : 'gray';
              return (
                <Tag key={role} type={tagType as 'red' | 'blue' | 'cyan' | 'purple' | 'teal' | 'gray'} size="sm">
                  {role}: {count}
                </Tag>
              );
            })}
          </div>
        </div>
      </Tile>
    </div>
  );
});
