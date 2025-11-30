/**
 * useService hook - Access DI container services in React components
 */

import { useMemo } from 'react';
import { container } from '../../core/di/ServiceContainer';
import type { ServiceToken } from '../../core/di/ServiceTokens';

/**
 * Hook to resolve services from DI container
 * @example
 * const alertService = useService(ServiceTokens.AlertService);
 */
export function useService<T>(token: ServiceToken<T>): T {
  return useMemo(() => container.resolve(token) as T, [token]);
}
