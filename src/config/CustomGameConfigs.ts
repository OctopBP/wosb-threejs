import type { SpawnArea } from './EnemyConfig'
import type { GameStateConfig } from './GameStateConfig'

// Example spawn area configurations demonstrating different gameplay scenarios

// 1. Corner Ambush Configuration - Enemies spawn from corners only
export const cornerAmbushAreas: SpawnArea[] = [
    {
        name: 'Northeast Corner',
        minX: 20,
        maxX: 40,
        minZ: 20,
        maxZ: 40,
    },
    {
        name: 'Northwest Corner',
        minX: -40,
        maxX: -20,
        minZ: 20,
        maxZ: 40,
    },
    {
        name: 'Southeast Corner',
        minX: 20,
        maxX: 40,
        minZ: -40,
        maxZ: -20,
    },
    {
        name: 'Southwest Corner',
        minX: -40,
        maxX: -20,
        minZ: -40,
        maxZ: -20,
    },
]

// 2. Ring Formation - No center spawns, forces enemies to come from edges
export const ringFormationAreas: SpawnArea[] = [
    {
        name: 'North Ring',
        minX: -30,
        maxX: 30,
        minZ: 15,
        maxZ: 30,
    },
    {
        name: 'East Ring',
        minX: 15,
        maxX: 30,
        minZ: -15,
        maxZ: 15,
    },
    {
        name: 'South Ring',
        minX: -30,
        maxX: 30,
        minZ: -30,
        maxZ: -15,
    },
    {
        name: 'West Ring',
        minX: -30,
        maxX: -15,
        minZ: -15,
        maxZ: 15,
    },
]

// 3. North-South Corridors - Creates lanes of combat
export const corridorAreas: SpawnArea[] = [
    {
        name: 'West Corridor',
        minX: -30,
        maxX: -10,
        minZ: -40,
        maxZ: 40,
    },
    {
        name: 'East Corridor',
        minX: 10,
        maxX: 30,
        minZ: -40,
        maxZ: 40,
    },
]

// 4. Compact Central Area - Tight combat space
export const compactCentralAreas: SpawnArea[] = [
    {
        name: 'Central Arena',
        minX: -15,
        maxX: 15,
        minZ: -15,
        maxZ: 15,
    },
]

// 5. Full Ocean - Large open battlefield
export const fullOceanAreas: SpawnArea[] = [
    {
        name: 'Full Ocean',
        minX: -40,
        maxX: 40,
        minZ: -40,
        maxZ: 40,
    },
]

// Example game configurations using the spawn areas

export const cornerAmbushConfig: GameStateConfig = {
    initialWave: {
        enemyCount: 1,
        minSpawnDistance: 15,
        maxSpawnDistance: 15,
    },
    wave1: {
        enemyCount: 3,
        minSpawnDistance: 25,
        maxSpawnDistance: 35,
    },
    wave2: {
        enemyCount: 8, // Reduced from 12 since corners might be harder
        minSpawnDistance: 25,
        maxSpawnDistance: 45,
    },
    boss: {
        minSpawnDistance: 25,
        maxSpawnDistance: 25,
        forceSpawnTimeSeconds: 20,
    },
    allowedAreas: cornerAmbushAreas,
}

export const ringFormationConfig: GameStateConfig = {
    initialWave: {
        enemyCount: 1,
        minSpawnDistance: 15,
        maxSpawnDistance: 15,
    },
    wave1: {
        enemyCount: 3,
        minSpawnDistance: 25,
        maxSpawnDistance: 35,
    },
    wave2: {
        enemyCount: 10,
        minSpawnDistance: 25,
        maxSpawnDistance: 45,
    },
    boss: {
        minSpawnDistance: 25,
        maxSpawnDistance: 25,
        forceSpawnTimeSeconds: 20,
    },
    allowedAreas: ringFormationAreas,
}

export const compactCombatConfig: GameStateConfig = {
    initialWave: {
        enemyCount: 1,
        minSpawnDistance: 10,
        maxSpawnDistance: 10,
    },
    wave1: {
        enemyCount: 3,
        minSpawnDistance: 12,
        maxSpawnDistance: 18,
    },
    wave2: {
        enemyCount: 12,
        minSpawnDistance: 15,
        maxSpawnDistance: 25,
    },
    boss: {
        minSpawnDistance: 20,
        maxSpawnDistance: 25,
        forceSpawnTimeSeconds: 20,
    },
    allowedAreas: compactCentralAreas,
}

export const corridorCombatConfig: GameStateConfig = {
    initialWave: {
        enemyCount: 1,
        minSpawnDistance: 15,
        maxSpawnDistance: 15,
    },
    wave1: {
        enemyCount: 4, // Even number for balanced corridor spawning
        minSpawnDistance: 20,
        maxSpawnDistance: 30,
    },
    wave2: {
        enemyCount: 10,
        minSpawnDistance: 25,
        maxSpawnDistance: 40,
    },
    boss: {
        minSpawnDistance: 25,
        maxSpawnDistance: 25,
        forceSpawnTimeSeconds: 20,
    },
    allowedAreas: corridorAreas,
}

export const openOceanConfig: GameStateConfig = {
    initialWave: {
        enemyCount: 1,
        minSpawnDistance: 15,
        maxSpawnDistance: 15,
    },
    wave1: {
        enemyCount: 3,
        minSpawnDistance: 25,
        maxSpawnDistance: 35,
    },
    wave2: {
        enemyCount: 12,
        minSpawnDistance: 25,
        maxSpawnDistance: 45,
    },
    boss: {
        minSpawnDistance: 25,
        maxSpawnDistance: 35,
        forceSpawnTimeSeconds: 20,
    },
    allowedAreas: fullOceanAreas,
}
