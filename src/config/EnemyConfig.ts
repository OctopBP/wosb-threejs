import type {
    EnemyAIComponent,
    HealthComponent,
    WeaponComponent,
} from '../ecs/Component'
import type { MovementConfigPreset } from './MovementPresets'
import type { WeaponConfigPreset } from './WeaponConfig'

// Enemy health configuration
export interface EnemyHealthConfig
    extends Omit<HealthComponent, 'type' | 'currentHealth' | 'isDead'> {
    maxHealth: number
}

// Enemy AI configuration
export interface EnemyAIConfig
    extends Omit<
        EnemyAIComponent,
        'type' | 'lastShotTime' | 'targetId' | 'movementDirection'
    > {
    moveSpeed: number
    shootingRange: number // This will be less important since weapon handles targeting
}

// Enemy spawning configuration
export interface EnemySpawningConfig {
    spawnInterval: number // seconds between spawns
    maxEnemies: number // maximum enemies on screen
    spawnDistance: number // distance from player to spawn
}

// Enemy movement configuration preset
export const enemyMovementPreset: MovementConfigPreset = {
    maxSpeed: 5.0,
    accelerationForce: 6.0,
    decelerationForce: 2.0,
    autoRotationStrength: 5,
    inputResponsiveness: 1.0,
    inputDeadZone: 0.1,
    pointerSensitivity: 0.8,
    linearDampening: 0.95,
    boundaries: {
        minX: -15,
        maxX: 15,
        minY: 0,
        maxY: 5,
        minZ: -15,
        maxZ: 15,
    },
}

// Basic enemy health configuration
export const basicEnemyHealthPreset: EnemyHealthConfig = {
    maxHealth: 50, // As specified in requirements
}

// Auto-targeting weapon configuration for enemies
export const autoTargetingEnemyWeaponPreset: WeaponConfigPreset = {
    damage: 15, // Decent damage but less than player's manual weapon
    fireRate: 0.8, // Slightly slower than player auto-targeting weapon
    projectileSpeed: 10.0, // Standard projectile speed
    range: 16.0, // Good range for enemies
    projectileType: 'sphere',
    // Auto-targeting properties
    isAutoTargeting: true,
    detectionRange: 18.0, // Larger detection range than firing range
    requiresLineOfSight: false,
}

// Alternative: Fast enemy auto-targeting weapon
export const fastEnemyWeaponPreset: WeaponConfigPreset = {
    damage: 10, // Lower damage
    fireRate: 1.5, // Faster fire rate
    projectileSpeed: 12.0, // Faster projectiles
    range: 14.0, // Shorter range
    projectileType: 'sphere',
    // Auto-targeting properties
    isAutoTargeting: true,
    detectionRange: 16.0,
    requiresLineOfSight: false,
}

// Legacy: Manual enemy weapon (for comparison/testing)
export const weakEnemyWeaponPreset: WeaponConfigPreset = {
    damage: 10,
    fireRate: 0.5,
    projectileSpeed: 8.0,
    range: 12.0,
    projectileType: 'sphere',
    // Manual targeting (old behavior)
    isAutoTargeting: false,
    detectionRange: 12.0,
    requiresLineOfSight: false,
}

// Basic enemy AI configuration
export const basicEnemyAIPreset: EnemyAIConfig = {
    moveSpeed: 1.0,
    shootingRange: 5.0,
}

// Enemy spawning configuration
export const enemySpawningConfig: EnemySpawningConfig = {
    spawnInterval: 3.0, // Spawn every 3 seconds
    maxEnemies: 5, // Maximum 5 enemies at once
    spawnDistance: 12.0, // Spawn 12 units away from player
}

// Helper functions to create configured components
export function createEnemyHealthConfig(
    overrides: Partial<EnemyHealthConfig> = {},
): HealthComponent {
    return {
        type: 'health',
        currentHealth: basicEnemyHealthPreset.maxHealth,
        isDead: false,
        ...basicEnemyHealthPreset,
        ...overrides,
    }
}

export function createEnemyWeaponConfig(
    overrides: Partial<WeaponConfigPreset> = {},
): WeaponComponent {
    return {
        type: 'weapon',
        lastShotTime: 0,
        ...autoTargetingEnemyWeaponPreset, // Use auto-targeting by default
        ...overrides,
    }
}

// Helper function to create manual enemy weapon (for testing/comparison)
export function createManualEnemyWeaponConfig(
    overrides: Partial<WeaponConfigPreset> = {},
): WeaponComponent {
    return {
        type: 'weapon',
        lastShotTime: 0,
        ...weakEnemyWeaponPreset, // Use manual targeting
        ...overrides,
    }
}

// Helper function to create fast auto-targeting enemy weapon
export function createFastEnemyWeaponConfig(
    overrides: Partial<WeaponConfigPreset> = {},
): WeaponComponent {
    return {
        type: 'weapon',
        lastShotTime: 0,
        ...fastEnemyWeaponPreset, // Use fast auto-targeting
        ...overrides,
    }
}

export function createEnemyAIConfig(
    targetId: number | null = null,
    overrides: Partial<EnemyAIConfig> = {},
): EnemyAIComponent {
    return {
        type: 'enemyAI',
        lastShotTime: 0,
        targetId: targetId,
        ...basicEnemyAIPreset,
        ...overrides,
    }
}
