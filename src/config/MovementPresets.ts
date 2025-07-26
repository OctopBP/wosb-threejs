import type { MovementConfigComponent } from '../ecs/Component'

export type MovementConfigPreset = Omit<MovementConfigComponent, 'type'>

// Balanced movement configuration for general gameplay
export const balancedPreset: MovementConfigPreset = {
    accelerationForce: 5.0,
    decelerationForce: 0.5,
    maxSpeed: 2.5, // Matches the new base speed from leveling config
    rotationAcceleration: 1.0, // How fast the ship accelerates its rotation
    maxRotationSpeed: 4.0, // Maximum rotation speed in radians per second
    inputDeadZone: 0.1,
    pointerSensitivity: 0.8,
    linearDampening: 0.95,
    rotationDampening: 0.8, // Rotation dampening to prevent oscillation
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
