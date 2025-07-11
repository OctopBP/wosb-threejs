import type {
    EnemyAIComponent,
    HealthComponent,
    WeaponComponent,
} from '../ecs/Component'
import type { MovementConfigPreset } from './MovementPresets'

// Enemy health configuration
export interface EnemyHealthConfig
    extends Omit<HealthComponent, 'type' | 'currentHealth' | 'isDead'> {
    maxHealth: number
}

// Enemy weapon configuration preset
export interface EnemyWeaponConfig
    extends Omit<WeaponComponent, 'type' | 'lastShotTime'> {
    damage: number
    fireRate: number
    projectileSpeed: number
    range: number
    projectileType: 'sphere'
}

// Enemy AI configuration
export interface EnemyAIConfig
    extends Omit<
        EnemyAIComponent,
        'type' | 'lastShotTime' | 'targetId' | 'movementDirection'
    > {
    moveSpeed: number
    shootingRange: number
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

// Weak weapon configuration for enemies
export const weakEnemyWeaponPreset: EnemyWeaponConfig = {
    damage: 15, // Weaker than player (player has 25)
    fireRate: 0.5, // Slower fire rate than player
    projectileSpeed: 8.0, // Slower projectiles
    range: 12.0, // Shorter range
    projectileType: 'sphere',
}

// Basic enemy AI configuration
export const basicEnemyAIPreset: EnemyAIConfig = {
    moveSpeed: 5.0,
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
    overrides: Partial<EnemyWeaponConfig> = {},
): WeaponComponent {
    return {
        type: 'weapon',
        lastShotTime: 0,
        ...weakEnemyWeaponPreset,
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
        movementDirection: {
            x: 0,
            z: -1, // Move towards player initially (negative Z)
        },
        ...basicEnemyAIPreset,
        ...overrides,
    }
}
