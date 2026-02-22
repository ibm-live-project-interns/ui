/**
 * Copyright IBM Corp. 2026
 *
 * Appearance & Role Tab section components.
 * Each renders the inner content of a settings Tile.
 */

import React from 'react';
import {
    FormGroup,
    RadioButtonGroup,
    RadioButton,
} from '@carbon/react';
import { ROLE_CONFIGS } from '@/features/roles/config/roleConfig';
import type { RoleId } from '@/features/roles/types';
import type { ThemeSetting } from './settings.types';

// ==========================================
// Role Section
// ==========================================

export interface RoleSectionProps {
    currentRoleId: string;
    onRoleChange: (role: RoleId) => void;
}

export const RoleSection = React.memo(function RoleSection({
    currentRoleId,
    onRoleChange,
}: RoleSectionProps) {
    return (
        <FormGroup legendText="Dashboard Role" className="settings-form-group">
            <RadioButtonGroup
                name="role-selection"
                valueSelected={currentRoleId}
                onChange={(v) => onRoleChange(v as RoleId)}
                orientation="vertical"
            >
                {Object.values(ROLE_CONFIGS).map((role) => (
                    <RadioButton
                        key={role.id}
                        id={`role-${role.id}`}
                        value={role.id}
                        labelText={
                            <div className="settings-role-label">
                                <span className="settings-role-name">{role.name}</span>
                                <span className="settings-role-description">{role.description}</span>
                            </div>
                        }
                    />
                ))}
            </RadioButtonGroup>
        </FormGroup>
    );
});

// ==========================================
// Appearance Section
// ==========================================

export interface AppearanceSectionProps {
    theme: ThemeSetting;
    onThemeChange: (val: ThemeSetting) => void;
}

export const AppearanceSection = React.memo(function AppearanceSection({
    theme,
    onThemeChange,
}: AppearanceSectionProps) {
    return (
        <FormGroup legendText="Theme" className="settings-form-group">
            <RadioButtonGroup
                name="theme-selection"
                valueSelected={theme}
                onChange={(v) => onThemeChange(v as ThemeSetting)}
                orientation="vertical"
            >
                <RadioButton id="theme-system" value="system" labelText="System default" />
                <RadioButton id="theme-light" value="light" labelText="Light mode" />
                <RadioButton id="theme-dark" value="dark" labelText="Dark mode" />
            </RadioButtonGroup>
        </FormGroup>
    );
});
