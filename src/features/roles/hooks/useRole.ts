/**
 * useRole Hook
 *
 * Custom hook for accessing role context.
 */

import { useRoleContext } from './RoleProvider';

export function useRole() {
    return useRoleContext();
}
