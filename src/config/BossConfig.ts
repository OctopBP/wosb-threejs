import type { FoamTrailComponent, HealthComponent } from '../ecs/Component'
import type { MovementConfigPreset } from './MovementPresets'
import { createBossWeaponConfig } from './WeaponConfig'

// Boss health configuration
export interface BossHealthConfig
    extends Omit<HealthComponent, 'type' | 'currentHealth' | 'isDead'> {
    maxHealth: number
}

export interface BossFoamTrailConfig extends Omit<FoamTrailComponent, 'type'> {}

// Boss visual configuration
export interface BossVisualConfig {
    scale: number // How much bigger the boss should be
    meshType: string // Mesh type to use for boss
}

// Boss movement configuration preset
export const bossMovementPreset: MovementConfigPreset = {
    maxSpeed: 4.0, // Much faster than player (even at max level)
    accelerationForce: 1.5, // Reduced for physics-based movement
    decelerationForce: 4.0,
    rotationAcceleration: 0.5, // Reduced for smoother boss movement
    maxRotationSpeed: 3.0, // Reduced max rotation speed
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

export const basicBossFoamTrailPreset: BossFoamTrailConfig = {
    size: 0.01,
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
