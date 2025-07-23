import type { MovementConfigComponent } from '../ecs/Component'

export type MovementConfigPreset = Omit<MovementConfigComponent, 'type'>

// Balanced movement configuration for general gameplay
export const balancedPreset: MovementConfigPreset = {
    accelerationForce: 8.0,
    decelerationForce: 0.5,
    maxSpeed: 2.5, // Matches the new base speed from leveling config
    autoRotationStrength: 1, // High value for near-instant rotation
    inputResponsiveness: 1.0,
    inputDeadZone: 0.1,
    pointerSensitivity: 0.8,
    linearDampening: 0.95,
}

// Helper function to create a movement configuration
export function createMovementConfig(
    overrides: Partial<MovementConfigPreset> = {},
): MovementConfigComponent {
    return {
        type: 'movementConfig',
        ...balancedPreset,
        ...overrides,
    }
}
