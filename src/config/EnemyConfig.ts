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
    maxSpeed: 4.0, // Faster than player's initial speed (2.5)
    accelerationForce: 8.0, // Quick acceleration to catch player
    decelerationForce: 3.0,
    autoRotationStrength: 6, // Good rotation for combat
    inputResponsiveness: 1.0,
    inputDeadZone: 0.1,
    pointerSensitivity: 0.8,
    linearDampening: 0.95,
}

// Basic enemy health configuration
export const basicEnemyHealthPreset: EnemyHealthConfig = {
    maxHealth: 50, // Dies in 2 hits at level 1 (25 damage), 1 hit at level 2 (50 damage)
}

// Basic enemy AI configuration
export const basicEnemyAIPreset: EnemyAIConfig = {
    moveSpeed: 3, // Faster AI movement speed
    shootingRange: 6.0, // Closer range for more aggressive combat
}

// Enemy spawning configuration
export const enemySpawningConfig: EnemySpawningConfig = {
    spawnInterval: 1.0, // Faster spawning for scenario timing
    maxEnemies: 15, // Allow for larger waves
    minSpawnDistance: 8.0, // Closer spawning for faster engagement
    maxSpawnDistance: 15.0, // Smaller max distance for quicker encounters
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
