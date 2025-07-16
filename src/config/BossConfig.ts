import type {
    EnemyAIComponent,
    HealthComponent,
    WeaponComponent,
} from '../ecs/Component'
import type { MovementConfigPreset } from './MovementPresets'
import type { WeaponConfigPreset } from './WeaponConfig'

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
    boundaries: {
        minX: -20,
        maxX: 20,
        minY: 0,
        maxY: 5,
        minZ: -20,
        maxZ: 20,
    },
}

// Boss health configuration
export const basicBossHealthPreset: BossHealthConfig = {
    maxHealth: 1000, // Much stronger than regular enemies
}

// Boss weapon configuration
export const bossWeaponPreset: WeaponConfigPreset = {
    damage: 100, // Very high damage - should kill player in 1 hit if player has 100 HP
    fireRate: 0.5, // Slower fire rate to balance the high damage
    projectileSpeed: 8.0, // Slower projectiles to give player chance to dodge
    range: 15.0, // Long range
    projectileType: 'bullet',
    // Auto-targeting properties
    isAutoTargeting: true,
    detectionRange: 18.0, // Very long detection range
    requiresLineOfSight: false,
}

// Boss AI configuration
export const basicBossAIPreset: BossAIConfig = {
    moveSpeed: 2.0, // Slower movement than regular enemies
    shootingRange: 15.0, // Long shooting range
}

// Boss visual configuration
export const basicBossVisualPreset: BossVisualConfig = {
    scale: 2.5, // 2.5x bigger than regular enemies
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

export function createBossWeaponConfig(
    overrides: Partial<WeaponConfigPreset> = {},
): WeaponComponent {
    return {
        type: 'weapon',
        lastShotTime: 0,
        ...bossWeaponPreset,
        ...overrides,
    }
}

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
