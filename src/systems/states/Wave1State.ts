import type { GameStateConfig } from '../../config/GameStateConfig'
import { getRandomSpawnDistanceForWaveOrBoss } from '../../config/GameStateConfig'
import type { GameStateComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import { BaseGameState } from './BaseGameState'
export class Wave1State extends BaseGameState {
    private wave1EnemiesSpawned = false

    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
        gameWorld: import('../../GameWorld').GameWorld,
    ): string | null {
        const waveConfig = config.wave1

        // Spawn all wave 1 enemies immediately when entering this state
        if (!this.wave1EnemiesSpawned) {
            for (let i = 0; i < waveConfig.enemyCount; i++) {
                this.spawnEnemyAroundPlayer(
                    world,
                    config,
                    getRandomSpawnDistanceForWaveOrBoss(waveConfig),
                )
                gameState.wave1EnemiesSpawned++
            }
            this.wave1EnemiesSpawned = true
        }

        // Check if all wave 1 enemies are defeated
        const aliveEnemies = this.getAliveEnemies(world, true) // exclude boss

        if (
            gameState.wave1EnemiesSpawned === waveConfig.enemyCount &&
            aliveEnemies.length === 0
        ) {
            return 'enemiesWave2'
        }

        return null // Stay in current state
    }
}
