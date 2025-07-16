import type { Component } from '../ecs/Component'
import { GameState, type GameStateData } from '../types/GameState'

export class GameStateComponent implements Component {
    public readonly type = 'gameState' as const
    public data: GameStateData

    constructor() {
        this.data = {
            currentState: GameState.WAVE_1,
            wave1EnemiesSpawned: 0,
            wave1EnemiesKilled: 0,
            wave2EnemiesSpawned: 0,
            wave2EnemiesKilled: 0,
            bossSpawned: false,
            bossKilled: false,
            playerDead: false,
        }
    }

    public getCurrentState(): GameState {
        return this.data.currentState
    }

    public setState(state: GameState): void {
        this.data.currentState = state
    }

    public isWave1Complete(): boolean {
        return (
            this.data.wave1EnemiesSpawned >= 5 &&
            this.data.wave1EnemiesKilled >= 5
        )
    }

    public isWave2Complete(): boolean {
        return (
            this.data.wave2EnemiesSpawned >= 10 &&
            this.data.wave2EnemiesKilled >= 10
        )
    }

    public isBossFightComplete(): boolean {
        return this.data.bossSpawned && this.data.bossKilled
    }

    public incrementWave1Spawned(): void {
        this.data.wave1EnemiesSpawned++
    }

    public incrementWave1Killed(): void {
        this.data.wave1EnemiesKilled++
    }

    public incrementWave2Spawned(): void {
        this.data.wave2EnemiesSpawned++
    }

    public incrementWave2Killed(): void {
        this.data.wave2EnemiesKilled++
    }

    public setBossSpawned(): void {
        this.data.bossSpawned = true
    }

    public setBossKilled(): void {
        this.data.bossKilled = true
    }

    public setPlayerDead(): void {
        this.data.playerDead = true
    }

    public reset(): void {
        this.data = {
            currentState: GameState.WAVE_1,
            wave1EnemiesSpawned: 0,
            wave1EnemiesKilled: 0,
            wave2EnemiesSpawned: 0,
            wave2EnemiesKilled: 0,
            bossSpawned: false,
            bossKilled: false,
            playerDead: false,
        }
    }
}
