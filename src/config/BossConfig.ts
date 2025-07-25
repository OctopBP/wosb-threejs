import type { HealthComponent } from '../ecs/Component'
import type { MovementConfigPreset } from './MovementPresets'
import { createBossWeaponConfig } from './WeaponConfig'

// Boss health configuration
export interface BossHealthConfig
    extends Omit<HealthComponent, 'type' | 'currentHealth' | 'isDead'> {
    maxHealth: number
}

// Boss visual configuration
export interface BossVisualConfig {
    scale: number // How much bigger the boss should be
    meshType: string // Mesh type to use for boss
}

// Boss movement configuration preset
export const bossMovementPreset: MovementConfigPreset = {
    maxSpeed: 4.0, // Much faster than player (even at max level)
    accelerationForce: 5.0, // Very quick acceleration
    decelerationForce: 4.0,
    rotationAcceleration: 1.0, // Fast rotation acceleration for combat
    maxRotationSpeed: 6.0, // High max rotation speed for agile combat
    inputDeadZone: 0.1,
    pointerSensitivity: 0.8,
    linearDampening: 0.9,
    rotationDampening: 0.7, // Good rotation dampening for responsive combat
}

// Boss health configuration
export const basicBossHealthPreset: BossHealthConfig = {
    maxHealth: 1000, // Lower health for quicker boss fight resolution
}

// Boss visual configuration
export const basicBossVisualPreset: BossVisualConfig = {
    scale: 0.5,
    meshType: 'boss', // For now use enemy model, can be changed to 'boss' later
}

// Helper functions to create configured boss components
export function createBossHealthConfig(
    overrides: Partial<BossHealthConfig> = {},
): HealthComponent {
    const config = { ...basicBossHealthPreset, ...overrides }
    return {
        type: 'health',
        currentHealth: config.maxHealth,
        isDead: false,
        maxHealth: config.maxHealth,
    }
}

// Re-export the boss weapon config function for convenience
export { createBossWeaponConfig }

export function getBossVisualConfig(
    overrides: Partial<BossVisualConfig> = {},
): BossVisualConfig {
    return {
        ...basicBossVisualPreset,
        ...overrides,
    }
}
