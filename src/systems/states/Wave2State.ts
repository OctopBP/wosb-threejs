import type { GameStateConfig } from '../../config/GameStateConfig'
import { getRandomSpawnDistanceForWaveOrBoss } from '../../config/GameStateConfig'
import type { GameStateComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import { BaseGameState } from './BaseGameState'

export class Wave2State extends BaseGameState {
    private wave2EnemiesSpawned = false

    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
        gameWorld?: any,
    ): string | null {
        const waveConfig = config.wave2

        // Spawn all wave 2 enemies immediately when entering this state
        if (!this.wave2EnemiesSpawned) {
            for (let i = 0; i < waveConfig.enemyCount; i++) {
                this.spawnEnemyAroundPlayer(
                    world,
                    config,
                    getRandomSpawnDistanceForWaveOrBoss(waveConfig),
                    gameWorld,
                )
                gameState.wave2EnemiesSpawned++
            }
            this.wave2EnemiesSpawned = true
            console.log(
                `🛡️ Wave 2: Spawned all ${waveConfig.enemyCount} enemies immediately!`,
            )
        }

        // Check if all wave 2 enemies are defeated
        const aliveEnemies = this.getAliveEnemies(world, true) // exclude boss

        if (
            gameState.wave2EnemiesSpawned === waveConfig.enemyCount &&
            aliveEnemies.length === 0
        ) {
            console.log('🎮 Game State: Wave 2 Complete! Boss Fight Starting!')
            return 'bossFight'
        }

        return null // Stay in current state
    }
}
