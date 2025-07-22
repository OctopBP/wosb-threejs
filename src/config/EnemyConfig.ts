import type { EnemyAIComponent, HealthComponent } from '../ecs/Component'
import type { MovementConfigPreset } from './MovementPresets'
import { createEnemyWeaponConfig } from './WeaponConfig'

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
    minSpawnDistance: number // minimum distance from player to spawn
    maxSpawnDistance: number // maximum distance from player to spawn
}

// Enemy movement configuration preset
export const enemyMovementPreset: MovementConfigPreset = {
    maxSpeed: 7.0,
    accelerationForce: 6.0,
    decelerationForce: 2.0,
    autoRotationStrength: 5,
    inputResponsiveness: 1.0,
    inputDeadZone: 0.1,
    pointerSensitivity: 0.8,
    linearDampening: 0.95,
}

// Basic enemy health configuration
export const basicEnemyHealthPreset: EnemyHealthConfig = {
    maxHealth: 50, // As specified in requirements
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
    minSpawnDistance: 12.0, // Minimum 12 units away from player
    maxSpawnDistance: 20.0, // Maximum 20 units away from player
}

// Helper to get a random spawn distance within the configured range
export function getRandomSpawnDistance(
    config: EnemySpawningConfig = enemySpawningConfig,
): number {
    const { minSpawnDistance, maxSpawnDistance } = config
    return (
        Math.random() * (maxSpawnDistance - minSpawnDistance) + minSpawnDistance
    )
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

// Re-export the enemy weapon config function for convenience
export { createEnemyWeaponConfig }

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
