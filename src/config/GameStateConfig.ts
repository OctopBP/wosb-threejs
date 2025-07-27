import type { SpawnArea } from './EnemyConfig'
import { defaultSpawnAreas } from './EnemyConfig'

// Game state configuration
export interface WaveConfig {
    enemyCount: number
    minSpawnDistance: number
    maxSpawnDistance: number
}

export interface BossConfig {
    minSpawnDistance: number
    maxSpawnDistance: number
    forceSpawnTimeSeconds: number // Configurable boss timer
}

export interface GameStateConfig {
    initialWave: WaveConfig // First single enemy
    wave1: WaveConfig // 3 enemies after initial
    wave2: WaveConfig // 12 enemies after wave1
    boss: BossConfig
    allowedAreas: SpawnArea[] // Single set of spawn areas for all waves and boss
}

// Default game state configuration
export const defaultGameStateConfig: GameStateConfig = {
    initialWave: {
        enemyCount: 1, // Single enemy at game start
        minSpawnDistance: 15,
        maxSpawnDistance: 15,
    },
    wave1: {
        enemyCount: 3, // 3 enemies for first wave
        minSpawnDistance: 25,
        maxSpawnDistance: 35,
    },
    wave2: {
        enemyCount: 12, // 12 enemies for second wave
        minSpawnDistance: 25,
        maxSpawnDistance: 45,
    },
    boss: {
        minSpawnDistance: 25,
        maxSpawnDistance: 25, // Fixed distance for consistent boss encounter
        forceSpawnTimeSeconds: 20, // Boss appears after 20 seconds if waves aren't complete
    },
    allowedAreas: defaultSpawnAreas,
}

// Helper to get a random spawn distance for a wave or boss
export function getRandomSpawnDistanceForWaveOrBoss(config: {
    minSpawnDistance: number
    maxSpawnDistance: number
}): number {
    const { minSpawnDistance, maxSpawnDistance } = config
    return (
        Math.random() * (maxSpawnDistance - minSpawnDistance) + minSpawnDistance
    )
}
