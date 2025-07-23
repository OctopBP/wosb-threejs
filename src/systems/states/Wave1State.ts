import type { GameStateConfig } from '../../config/GameStateConfig'
import { getRandomSpawnDistanceForWaveOrBoss } from '../../config/GameStateConfig'
import type { GameStateComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import { BaseGameState } from './BaseGameState'

export class Wave1State extends BaseGameState {
    private initialEnemySpawned = false

    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
    ): string | null {
        const waveConfig = config.wave1

        // Spawn the first enemy immediately at game start
        if (!this.initialEnemySpawned) {
            this.spawnEnemyAroundPlayer(
                world,
                config,
                getRandomSpawnDistanceForWaveOrBoss(waveConfig),
            )
            this.initialEnemySpawned = true
            gameState.wave1EnemiesSpawned = 1
            console.log('🛡️ Wave 1: Initial enemy spawned!')
            return null
        }

        // Check if initial enemy is defeated, then spawn the rest
        const aliveEnemies = this.getAliveEnemies(world, true) // exclude boss

        // If initial enemy is defeated and we haven't spawned the wave yet
        if (aliveEnemies.length === 0 && gameState.wave1EnemiesSpawned === 1) {
            // Spawn all 3 remaining enemies immediately
            for (let i = 0; i < waveConfig.enemyCount; i++) {
                this.spawnEnemyAroundPlayer(
                    world,
                    config,
                    getRandomSpawnDistanceForWaveOrBoss(waveConfig),
                )
                gameState.wave1EnemiesSpawned++
            }
            console.log(
                `🛡️ Wave 1: Spawned ${waveConfig.enemyCount} enemies after initial defeat!`,
            )
            return null
        }

        // Check if all wave 1 enemies are defeated
        if (
            gameState.wave1EnemiesSpawned === waveConfig.enemyCount + 1 && // +1 for initial enemy
            aliveEnemies.length === 0
        ) {
            console.log('🎮 Game State: Wave 1 Complete! Starting Wave 2')
            return 'enemiesWave2'
        }

        return null // Stay in current state
    }
}
