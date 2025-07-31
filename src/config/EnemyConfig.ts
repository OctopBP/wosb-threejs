import type { FoamTrailComponent, HealthComponent } from '../ecs/Component'
import type { MovementConfigPreset } from './MovementPresets'
import { createEnemyWeaponConfig } from './WeaponConfig'

// Enemy health configuration
export interface EnemyHealthConfig
    extends Omit<HealthComponent, 'type' | 'currentHealth' | 'isDead'> {
    maxHealth: number
}

export interface FoamTrailConfig extends Omit<FoamTrailComponent, 'type'> {}

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
    accelerationForce: 5.0,
    decelerationForce: 0.5,
    rotationAcceleration: 2.0,
    maxRotationSpeed: 6.0,
    inputDeadZone: 0.1,
    pointerSensitivity: 0.8,
    linearDampening: 0.95,
    rotationDampening: 0.75,
}

// Basic enemy health configuration
export const basicEnemyHealthPreset: EnemyHealthConfig = {
    maxHealth: 50,
}

export const basicEnemyFoamTrailPreset: FoamTrailConfig = {
    size: 0.004,
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
