import type { MovementConfigComponent } from '../ecs/Component'

export type MovementConfigPreset = Omit<MovementConfigComponent, 'type'>

// Balanced movement configuration for general gameplay
export const balancedPreset: MovementConfigPreset = {
    maxSpeed: 5.5,
    accelerationForce: 10.0,
    decelerationForce: 10.0,
    rotationAcceleration: 2.0,
    maxRotationSpeed: 6.0,
    inputDeadZone: 0.1,
    pointerSensitivity: 0.8,
    linearDampening: 0.95,
    rotationDampening: 0.8,
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
