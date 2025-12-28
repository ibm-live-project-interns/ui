/**
 * Config Index
 * 
 * Re-exports all configuration for clean imports:
 *   import { env, API_ENDPOINTS, buildApiUrl } from '@/config';
 */

export {
    env,
    API_ENDPOINTS,
    buildApiUrl,
    isFeatureEnabled,
    isMockMode,
} from './environment';
