// Game state configuration
export interface WaveConfig {
    enemyCount: number
    minSpawnDistance: number
    maxSpawnDistance: number
    xpMultiplier: number
}

export interface BossConfig {
    minSpawnDistance: number
    maxSpawnDistance: number
    xpMultiplier: number
}

export interface GameStateConfig {
    wave1: WaveConfig
    wave2: WaveConfig
    boss: BossConfig
    spawning: {
        spawnHeightOffset: number
        spawnAngleRandomness: boolean
    }
}

// Default game state configuration
export const defaultGameStateConfig: GameStateConfig = {
    wave1: {
        enemyCount: 3, // 3 enemies for first half of the game (after initial enemy)
        minSpawnDistance: 8,
        maxSpawnDistance: 15,
        xpMultiplier: 1, // Normal XP for wave 1 enemies
    },
    wave2: {
        enemyCount: 12, // 12 enemies for second half of the game
        minSpawnDistance: 8,
        maxSpawnDistance: 15,
        xpMultiplier: 1, // Normal XP for wave 2 enemies
    },
    boss: {
        minSpawnDistance: 12,
        maxSpawnDistance: 12, // Fixed distance for consistent boss encounter
        xpMultiplier: 20, // 20x XP for boss
    },
    spawning: {
        spawnHeightOffset: 0.1, // Y position for spawned entities
        spawnAngleRandomness: true, // Whether to randomize spawn angles
    },
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
