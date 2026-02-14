/**
 * Role Provider
 *
 * Context provider for role-based dashboard functionality.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getRoleConfig, ROLES } from '../config/roleConfig';
import type { RoleConfig, Role, RoleId } from '../types';

// ==========================================
// Context Definition
// ==========================================

interface RoleContextValue {
    currentRole: RoleConfig;
    availableRoles: Role[];
    setRole: (roleId: RoleId) => void;
    hasPermission: (permission: string) => boolean;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

// ==========================================
// Provider Component
// ==========================================

interface RoleProviderProps {
    children: ReactNode;
    defaultRole?: RoleId;
}

export function RoleProvider({ children, defaultRole = 'network-ops' }: RoleProviderProps) {
    const [roleId, setRoleId] = useState<RoleId>(() => {
        // Try to load from localStorage
        const saved = localStorage.getItem('user-role');
        return (saved as RoleId) || defaultRole;
    });

    const currentRole = getRoleConfig(roleId);
    const availableRoles = Object.values(ROLES);

    useEffect(() => {
        // Persist role selection
        localStorage.setItem('user-role', roleId);
    }, [roleId]);

    // Listen for role changes from authService (login/logout) so sidebar updates
    useEffect(() => {
        const handleRoleChanged = (e: Event) => {
            const newRole = (e as CustomEvent).detail as RoleId;
            if (newRole && newRole !== roleId) {
                setRoleId(newRole);
            }
        };
        window.addEventListener('role-changed', handleRoleChanged);
        return () => window.removeEventListener('role-changed', handleRoleChanged);
    }, [roleId]);

    const setRole = (newRoleId: RoleId) => {
        setRoleId(newRoleId);
    };

    const hasPermission = (permission: string): boolean => {
        return currentRole.permissions.includes(permission as any);
    };

    const value: RoleContextValue = {
        currentRole,
        availableRoles,
        setRole,
        hasPermission,
    };

    return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

// ==========================================
// Hook
// ==========================================

export function useRoleContext(): RoleContextValue {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error('useRoleContext must be used within RoleProvider');
    }
    return context;
}
