import type { FoamTrailComponent, HealthComponent } from '../ecs/Component'
import type { MovementConfigPreset } from './MovementPresets'
import { createEnemyWeaponConfig } from './WeaponConfig'

// Enemy health configuration
export interface EnemyHealthConfig
    extends Omit<HealthComponent, 'type' | 'currentHealth' | 'isDead'> {
    maxHealth: number
}

export interface FoamTrailConfig extends Omit<FoamTrailComponent, 'type'> {}

// Allowed spawn area definition
export interface SpawnArea {
    name: string // Descriptive name for the area
    minX: number
    maxX: number
    minZ: number
    maxZ: number
}

// Enemy spawning configuration
export interface EnemySpawningConfig {
    spawnInterval: number // seconds between spawns
    maxEnemies: number // maximum enemies on screen
    minSpawnDistance: number // minimum distance from player to spawn
    maxSpawnDistance: number // maximum distance from player to spawn
    allowedAreas: SpawnArea[] // Areas where enemies can spawn
}

// Default allowed spawn areas - covers the entire playable area
export const defaultSpawnAreas: SpawnArea[] = [
    {
        name: 'Main Ocean Area',
        minX: -40,
        maxX: 40,
        minZ: -40,
        maxZ: 40,
    },
]

// Enemy movement configuration preset
export const enemyMovementPreset: MovementConfigPreset = {
    maxSpeed: 3.5, // Faster than player's initial speed (2.5)
    accelerationForce: 8.0, // Quick acceleration to catch player
    decelerationForce: 3.0,
    rotationAcceleration: 1.0, // Good rotation acceleration for combat
    maxRotationSpeed: 5.0, // Good max rotation speed for responsive movement
    inputDeadZone: 0.1,
    pointerSensitivity: 0.8,
    linearDampening: 0.95,
    rotationDampening: 0.75, // Good rotation dampening for stable movement
}

// Basic enemy health configuration
export const basicEnemyHealthPreset: EnemyHealthConfig = {
    maxHealth: 50, // Dies in 2 hits at level 1 (25 damage), 1 hit at level 2 (50 damage)
}

export const basicEnemyFoamTrailPreset: FoamTrailConfig = {
    size: 0.004,
}

// Helper functions to validate spawn areas
export function isPositionInArea(
    x: number,
    z: number,
    area: SpawnArea,
): boolean {
    return x >= area.minX && x <= area.maxX && z >= area.minZ && z <= area.maxZ
}

export function isPositionInAnyAllowedArea(
    x: number,
    z: number,
    allowedAreas: SpawnArea[],
): boolean {
    return allowedAreas.some((area) => isPositionInArea(x, z, area))
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
