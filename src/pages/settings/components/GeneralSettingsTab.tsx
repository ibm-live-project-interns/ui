/**
 * Copyright IBM Corp. 2026
 *
 * General Settings Tab - Language, timezone, and auto-refresh preferences.
 */

import React from 'react';
import {
    Select,
    SelectItem,
    Toggle,
} from '@carbon/react';
import { ComingSoonModal, useComingSoon } from '@/components/ui';
import type { GeneralSettings } from './settings.types';
import { GENERAL_OPTS } from './settings.types';

export interface GeneralSettingsTabProps {
    general: GeneralSettings;
    onUpdate: <K extends keyof GeneralSettings>(key: K, val: GeneralSettings[K]) => void;
}

export const GeneralSettingsTab = React.memo(function GeneralSettingsTab({
    general,
    onUpdate,
}: GeneralSettingsTabProps) {
    const { open: comingSoonOpen, feature: comingSoonFeature, showComingSoon, hideComingSoon } = useComingSoon();

    const handleLanguageChange = (value: string) => {
        if (value !== 'en') {
            showComingSoon({
                name: 'Internationalization (i18n)',
                description: 'Multi-language support is currently under development. Only English is supported at this time.',
            });
            // Reset to English
            onUpdate('language', 'en');
            return;
        }
        onUpdate('language', value);
    };

    return (
        <div className="settings-tile-content settings-tile-content--general">
            <div className="settings-select-row">
                {/* Language selector -- i18n is not yet implemented */}
                <Select
                    id="lang"
                    labelText="Language"
                    value={general.language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    helperText="Only English is currently supported"
                >
                    {GENERAL_OPTS.languages.map(opt => (
                        <SelectItem key={opt.value} {...opt} />
                    ))}
                </Select>
                <Select
                    id="tz"
                    labelText="Timezone"
                    value={general.timezone}
                    onChange={(e) => onUpdate('timezone', e.target.value)}
                >
                    {GENERAL_OPTS.timezones.map(opt => (
                        <SelectItem key={opt.value} {...opt} />
                    ))}
                </Select>
            </div>
            <div className="settings-refresh-group">
                <div className="settings-toggle-item">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-text">
                            <span className="settings-toggle-label">Auto-refresh Dashboard</span>
                            <span className="settings-toggle-description">Automatically refresh alert data across all pages</span>
                        </div>
                    </div>
                    <Toggle
                        id="auto-refresh"
                        labelA=""
                        labelB=""
                        size="sm"
                        toggled={general.autoRefresh}
                        onToggle={() => onUpdate('autoRefresh', !general.autoRefresh)}
                    />
                </div>
                {general.autoRefresh && (
                    <Select
                        id="interval"
                        labelText="Refresh Interval"
                        value={general.refreshInterval}
                        onChange={(e) => onUpdate('refreshInterval', e.target.value)}
                        className="settings-refresh-interval"
                    >
                        {GENERAL_OPTS.intervals.map(opt => (
                            <SelectItem key={opt.value} {...opt} />
                        ))}
                    </Select>
                )}
            </div>

            {/* Coming Soon Modal */}
            <ComingSoonModal open={comingSoonOpen} onClose={hideComingSoon} feature={comingSoonFeature} />
        </div>
    );
});
