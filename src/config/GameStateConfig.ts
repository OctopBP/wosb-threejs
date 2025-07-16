// Game state configuration
export interface WaveConfig {
    enemyCount: number
    spawnDistance: number
    xpMultiplier: number
}

export interface BossConfig {
    spawnDistance: number
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
        enemyCount: 3,
        spawnDistance: 12,
        xpMultiplier: 1, // Normal XP for wave 1 enemies
    },
    wave2: {
        enemyCount: 5,
        spawnDistance: 12,
        xpMultiplier: 1, // Normal XP for wave 2 enemies
    },
    boss: {
        spawnDistance: 15,
        xpMultiplier: 20, // 20x XP for boss
    },
    spawning: {
        spawnHeightOffset: 0.1, // Y position for spawned entities
        spawnAngleRandomness: true, // Whether to randomize spawn angles
    },
}

// Easy difficulty preset
export const easyGameStateConfig: GameStateConfig = {
    ...defaultGameStateConfig,
    wave1: {
        ...defaultGameStateConfig.wave1,
        enemyCount: 3,
    },
    wave2: {
        ...defaultGameStateConfig.wave2,
        enemyCount: 6,
    },
    boss: {
        ...defaultGameStateConfig.boss,
        xpMultiplier: 15,
    },
}

// Hard difficulty preset
export const hardGameStateConfig: GameStateConfig = {
    ...defaultGameStateConfig,
    wave1: {
        ...defaultGameStateConfig.wave1,
        enemyCount: 8,
    },
    wave2: {
        ...defaultGameStateConfig.wave2,
        enemyCount: 15,
    },
    boss: {
        ...defaultGameStateConfig.boss,
        xpMultiplier: 25,
    },
}
