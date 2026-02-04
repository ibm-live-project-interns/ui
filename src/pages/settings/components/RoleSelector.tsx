/**
 * Role Selector Component
 *
 * Allows users to switch between different dashboard roles.
 */

import { Tile, RadioButtonGroup, RadioButton } from '@carbon/react';
import { useRole } from '@/features/roles/hooks';
import type { RoleId } from '@/features/roles/types';

export function RoleSelector() {
    const { currentRole, availableRoles, setRole } = useRole();

    const handleRoleChange = (selection: string | number | undefined) => {
        if (typeof selection === 'string') {
            setRole(selection as RoleId);
        }
    };

    return (
        <Tile className="settings-section">
            <h3>Dashboard Role</h3>
            <p className="section-description">
                Select your role to customize your dashboard view
            </p>
            <RadioButtonGroup
                legendText=""
                name="role-selector"
                valueSelected={currentRole.id}
                onChange={handleRoleChange}
                orientation="vertical"
            >
                {availableRoles.map((role) => (
                    <RadioButton
                        key={role.id}
                        labelText={role.name}
                        value={role.id}
                        id={`role-${role.id}`}
                    />
                ))}
            </RadioButtonGroup>
        </Tile>
    );
}
