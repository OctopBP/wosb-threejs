export enum GameState {
    WAVE_1 = 'wave1',
    WAVE_2 = 'wave2',
    BOSS_FIGHT = 'boss_fight',
    NEW_SHIP_OFFER = 'new_ship_offer',
}

export interface GameStateData {
    currentState: GameState
    wave1EnemiesSpawned: number
    wave1EnemiesKilled: number
    wave2EnemiesSpawned: number
    wave2EnemiesKilled: number
    bossSpawned: boolean
    bossKilled: boolean
    playerDead: boolean
}

export interface WaveConfig {
    maxEnemies: number
    spawnDelay: number
    enemyType: string
}

export const WAVE_CONFIGS: Record<GameState, WaveConfig | null> = {
    [GameState.WAVE_1]: {
        maxEnemies: 5,
        spawnDelay: 2000,
        enemyType: 'basic',
    },
    [GameState.WAVE_2]: {
        maxEnemies: 10,
        spawnDelay: 1500,
        enemyType: 'basic',
    },
    [GameState.BOSS_FIGHT]: {
        maxEnemies: 1,
        spawnDelay: 0,
        enemyType: 'boss',
    },
    [GameState.NEW_SHIP_OFFER]: null,
}
