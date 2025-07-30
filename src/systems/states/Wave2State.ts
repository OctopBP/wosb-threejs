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
        gameWorld: import('../../GameWorld').GameWorld,
    ): string | null {
        const waveConfig = config.wave2

        // Spawn all wave 2 enemies immediately when entering this state
        if (!this.wave2EnemiesSpawned) {
            for (let i = 0; i < waveConfig.enemyCount; i++) {
                this.spawnEnemyAroundPlayer(
                    world,
                    config,
                    getRandomSpawnDistanceForWaveOrBoss(waveConfig),
                )
                gameState.wave2EnemiesSpawned++
            }
            this.wave2EnemiesSpawned = true
        }

        // Check if all wave 2 enemies are defeated
        const aliveEnemies = this.getAliveEnemies(world, true) // exclude boss

        if (
            gameState.wave2EnemiesSpawned === waveConfig.enemyCount &&
            aliveEnemies.length === 0
        ) {
            return 'bossPreview'
        }

        return null // Stay in current state
    }
}
