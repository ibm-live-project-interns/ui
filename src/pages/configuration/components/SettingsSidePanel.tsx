/**
 * Settings Side Panel
 *
 * Displays global settings toggles (Maintenance Mode, Auto-Resolve, AI Correlation)
 * and a list of active notification channels.
 */

import React from 'react';
import { Toggle } from '@carbon/react';
import { SettingsAdjust, NotificationNew } from '@carbon/icons-react';

import { ICON_MAP } from '../types';
import type { SettingsSidePanelProps } from './thresholdRules.types';

const SETTINGS_CONFIG = [
  { label: 'Maintenance Mode', desc: 'Suppress all non-critical alerts', key: 'maintenanceMode' as const },
  { label: 'Auto-Resolve', desc: 'Close alerts after 24h of silence', key: 'autoResolve' as const },
  { label: 'AI Correlation', desc: 'Group related alerts automatically', key: 'aiCorrelation' as const },
] as const;

export const SettingsSidePanel = React.memo(function SettingsSidePanel({
  maintenanceMode,
  autoResolve,
  aiCorrelation,
  onToggleSetting,
  channels,
  onNavigateToChannels,
}: SettingsSidePanelProps) {
  const settingsMap = { maintenanceMode, autoResolve, aiCorrelation };
  const EmailIcon = ICON_MAP['Email'];

  return (
    <div className="settings-section threshold-rules__settings-section">
      <div className="settings-panel">
        <div className="settings-panel__header">
          <h3><SettingsAdjust size={16} /> Global Settings</h3>
        </div>
        <div className="settings-panel__content">
          {SETTINGS_CONFIG.map((setting) => (
            <div className="setting-row threshold-rules__setting-row" key={setting.key}>
              <div className="threshold-rules__setting-toggle-row">
                <span className="setting-name threshold-rules__setting-name">{setting.label}</span>
                <Toggle
                  id={setting.key}
                  size="sm"
                  toggled={settingsMap[setting.key]}
                  onToggle={() => onToggleSetting(setting.key)}
                  labelA="Off" labelB="On" hideLabel
                  aria-label={`Toggle ${setting.label}`}
                />
              </div>
              <span className="setting-description threshold-rules__setting-description">{setting.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="settings-panel">
        <div className="settings-panel__header">
          <h3><NotificationNew size={16} className="threshold-rules__notification-icon" /> Active Channels</h3>
          <button className="panel-action" onClick={onNavigateToChannels}>Configure</button>
        </div>
        <div className="settings-panel__content">
          {channels.filter((c) => c.active).map((channel) => {
            const Icon = ICON_MAP[channel.type] || EmailIcon;
            return (
              <div key={channel.id} className="channel-item threshold-rules__channel-item">
                <div className="channel-info threshold-rules__channel-info">
                  <Icon size={18} />
                  <span className="channel-name threshold-rules__channel-name">{channel.name}</span>
                  <div className="channel-status threshold-rules__channel-status" />
                </div>
                <span className="threshold-rules__channel-meta">{channel.type} - {channel.meta}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
