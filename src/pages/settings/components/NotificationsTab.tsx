/**
 * Copyright IBM Corp. 2026
 *
 * Notifications Tab - Toggle controls for email, push, sound, and critical-only alerts.
 */

import React from 'react';
import {
    Toggle,
} from '@carbon/react';
import { ComingSoonModal, useComingSoon } from '@/components/ui';
import type { NotificationSettings, NotificationKey } from './settings.types';
import { NOTIFICATION_OPTS } from './settings.types';

export interface NotificationsTabProps {
    notifications: NotificationSettings;
    onUpdate: (key: NotificationKey, val: boolean) => void;
}

export const NotificationsTab = React.memo(function NotificationsTab({
    notifications,
    onUpdate,
}: NotificationsTabProps) {
    const { open: comingSoonOpen, feature: comingSoonFeature, showComingSoon, hideComingSoon } = useComingSoon();

    const handleToggle = (item: typeof NOTIFICATION_OPTS[number]) => {
        if ('comingSoon' in item && item.comingSoon) {
            showComingSoon({
                name: item.label,
                description: `${item.desc}. This feature is currently under development and will be available in a future release.`,
            });
            return;
        }
        onUpdate(item.key, !notifications[item.key]);
    };

    return (
        <div className="settings-tile-content">
            <div className="settings-toggle-group">
                {NOTIFICATION_OPTS.map((item) => (
                    <div className="settings-toggle-item" key={item.key}>
                        <div className="settings-toggle-info">
                            <item.icon size={16} className="settings-toggle-icon" />
                            <div className="settings-toggle-text">
                                <span className="settings-toggle-label">{item.label}</span>
                                <span className="settings-toggle-description">{item.desc}</span>
                            </div>
                        </div>
                        <Toggle
                            id={item.key}
                            labelA=""
                            labelB=""
                            size="sm"
                            toggled={notifications[item.key]}
                            onToggle={() => handleToggle(item)}
                        />
                    </div>
                ))}
            </div>

            {/* Coming Soon Modal */}
            <ComingSoonModal open={comingSoonOpen} onClose={hideComingSoon} feature={comingSoonFeature} />
        </div>
    );
});
