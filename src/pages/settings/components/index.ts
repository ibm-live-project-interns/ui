/**
 * Settings Components Index
 */

export { RoleSelector } from './RoleSelector';

// Settings hook
export { useSettings } from './useSettings';
export type { UseSettingsReturn } from './useSettings';

// Types & constants
export type {
    ThemeSetting,
    NotificationSettings,
    NotificationKey,
    GeneralSettings,
    SettingsState,
    NotificationOption,
} from './settings.types';
export {
    GENERAL_OPTS,
    NOTIFICATION_OPTS,
    DEFAULT_SETTINGS,
    AUTO_REFRESH_KEY,
    REFRESH_INTERVAL_KEY,
} from './settings.types';

// Tab section components
export { GeneralSettingsTab } from './GeneralSettingsTab';
export type { GeneralSettingsTabProps } from './GeneralSettingsTab';

export { RoleSection, AppearanceSection } from './AppearanceRoleTab';
export type { RoleSectionProps, AppearanceSectionProps } from './AppearanceRoleTab';

export { NotificationsTab } from './NotificationsTab';
export type { NotificationsTabProps } from './NotificationsTab';
