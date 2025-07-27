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

// 4. Progressive Expansion - Areas get bigger with each wave
export const wave1Areas: SpawnArea[] = [
    {
        name: 'Inner Circle',
        minX: -15,
        maxX: 15,
        minZ: -15,
        maxZ: 15,
    },
]

export const wave2Areas: SpawnArea[] = [
    {
        name: 'Expanded Ocean',
        minX: -25,
        maxX: 25,
        minZ: -25,
        maxZ: 25,
    },
]

export const bossAreas: SpawnArea[] = [
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
        allowedAreas: cornerAmbushAreas,
    },
    wave1: {
        enemyCount: 3,
        minSpawnDistance: 25,
        maxSpawnDistance: 35,
        allowedAreas: cornerAmbushAreas,
    },
    wave2: {
        enemyCount: 8, // Reduced from 12 since corners might be harder
        minSpawnDistance: 25,
        maxSpawnDistance: 45,
        allowedAreas: cornerAmbushAreas,
    },
    boss: {
        minSpawnDistance: 25,
        maxSpawnDistance: 25,
        forceSpawnTimeSeconds: 20,
        allowedAreas: cornerAmbushAreas,
    },
}

export const ringFormationConfig: GameStateConfig = {
    initialWave: {
        enemyCount: 1,
        minSpawnDistance: 15,
        maxSpawnDistance: 15,
        allowedAreas: ringFormationAreas,
    },
    wave1: {
        enemyCount: 3,
        minSpawnDistance: 25,
        maxSpawnDistance: 35,
        allowedAreas: ringFormationAreas,
    },
    wave2: {
        enemyCount: 10,
        minSpawnDistance: 25,
        maxSpawnDistance: 45,
        allowedAreas: ringFormationAreas,
    },
    boss: {
        minSpawnDistance: 25,
        maxSpawnDistance: 25,
        forceSpawnTimeSeconds: 20,
        allowedAreas: ringFormationAreas,
    },
}

export const progressiveExpansionConfig: GameStateConfig = {
    initialWave: {
        enemyCount: 1,
        minSpawnDistance: 10,
        maxSpawnDistance: 10,
        allowedAreas: wave1Areas,
    },
    wave1: {
        enemyCount: 3,
        minSpawnDistance: 12,
        maxSpawnDistance: 18,
        allowedAreas: wave1Areas, // Start tight
    },
    wave2: {
        enemyCount: 12,
        minSpawnDistance: 20,
        maxSpawnDistance: 30,
        allowedAreas: wave2Areas, // Expand battlefield
    },
    boss: {
        minSpawnDistance: 25,
        maxSpawnDistance: 35,
        forceSpawnTimeSeconds: 20,
        allowedAreas: bossAreas, // Full area for boss
    },
}

export const corridorCombatConfig: GameStateConfig = {
    initialWave: {
        enemyCount: 1,
        minSpawnDistance: 15,
        maxSpawnDistance: 15,
        allowedAreas: corridorAreas,
    },
    wave1: {
        enemyCount: 4, // Even number for balanced corridor spawning
        minSpawnDistance: 20,
        maxSpawnDistance: 30,
        allowedAreas: corridorAreas,
    },
    wave2: {
        enemyCount: 10,
        minSpawnDistance: 25,
        maxSpawnDistance: 40,
        allowedAreas: corridorAreas,
    },
    boss: {
        minSpawnDistance: 25,
        maxSpawnDistance: 25,
        forceSpawnTimeSeconds: 20,
        allowedAreas: corridorAreas,
    },
}
