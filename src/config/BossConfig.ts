import type { EnemyAIComponent, HealthComponent } from '../ecs/Component'
import type { MovementConfigPreset } from './MovementPresets'
import { createBossWeaponConfig } from './WeaponConfig'

// Boss health configuration
export interface BossHealthConfig
    extends Omit<HealthComponent, 'type' | 'currentHealth' | 'isDead'> {
    maxHealth: number
}

// Boss AI configuration
export interface BossAIConfig
    extends Omit<EnemyAIComponent, 'type' | 'lastShotTime' | 'targetId'> {
    moveSpeed: number
    shootingRange: number
}

// Boss visual configuration
export interface BossVisualConfig {
    scale: number // How much bigger the boss should be
    meshType: string // Mesh type to use for boss
}

// Boss movement configuration preset
export const bossMovementPreset: MovementConfigPreset = {
    maxSpeed: 3.0, // Slower than regular enemies
    accelerationForce: 2.5,
    decelerationForce: 1.5,
    autoRotationStrength: 3,
    inputResponsiveness: 0.8,
    inputDeadZone: 0.1,
    pointerSensitivity: 0.5,
    linearDampening: 0.9,
}

// Boss health configuration
export const basicBossHealthPreset: BossHealthConfig = {
    maxHealth: 1000, // Much stronger than regular enemies
}

// Boss AI configuration
export const basicBossAIPreset: BossAIConfig = {
    moveSpeed: 2.0, // Slower movement than regular enemies
    shootingRange: 15.0, // Long shooting range
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

export function createBossAIConfig(
    targetId: number | null = null,
    overrides: Partial<BossAIConfig> = {},
): EnemyAIComponent {
    return {
        type: 'enemyAI',
        lastShotTime: 0,
        targetId: targetId,
        ...basicBossAIPreset,
        ...overrides,
    }
}

export function getBossVisualConfig(
    overrides: Partial<BossVisualConfig> = {},
): BossVisualConfig {
    return {
        ...basicBossVisualPreset,
        ...overrides,
    }
}
