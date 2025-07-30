import type { GameStateConfig } from '../../config/GameStateConfig'
import { getRandomSpawnDistanceForWaveOrBoss } from '../../config/GameStateConfig'
import type { GameStateComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import { BaseGameState } from './BaseGameState'
export class InitialWaveState extends BaseGameState {
    private initialEnemySpawned = false

    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
    ): string | null {
        const initialWaveConfig = config.initialWave

        // Spawn the initial enemy immediately at game start
        if (!this.initialEnemySpawned) {
            this.spawnEnemyAroundPlayer(
                world,
                config,
                getRandomSpawnDistanceForWaveOrBoss(initialWaveConfig),
            )
            this.initialEnemySpawned = true
            gameState.initialWaveEnemiesSpawned = 1
        }

        // Check if initial enemy is defeated
        const aliveEnemies = this.getAliveEnemies(world, true) // exclude boss

        if (
            gameState.initialWaveEnemiesSpawned ===
                initialWaveConfig.enemyCount &&
            aliveEnemies.length === 0
        ) {
            return 'enemiesWave1'
        }

        return null // Stay in current state
    }
}
