import type { MovementConfigComponent } from '../ecs/Component'

export type MovementConfigPreset = Omit<MovementConfigComponent, 'type'>

// Balanced movement configuration for general gameplay
export const balancedPreset: MovementConfigPreset = {
    accelerationForce: 8.0,
    decelerationForce: 2.0,
    maxSpeed: 3.0,
    autoRotationStrength: 2, // High value for near-instant rotation
    inputResponsiveness: 1.0,
    inputDeadZone: 0.1,
    pointerSensitivity: 0.8,
    linearDampening: 0.95,
    boundaries: {
        minX: -10,
        maxX: 10,
        minY: 0,
        maxY: 5,
        minZ: -10,
        maxZ: 10,
    },
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
