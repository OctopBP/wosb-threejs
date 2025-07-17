import type { GameStateConfig } from '../../config/GameStateConfig'
import type { GameStateComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import { BaseGameState } from './BaseGameState'

export class Wave1State extends BaseGameState {
    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
    ): string | null {
        const waveConfig = config.wave1

        // Spawn enemies for wave 1
        if (gameState.wave1EnemiesSpawned < waveConfig.enemyCount) {
            this.spawnEnemyAroundPlayer(world, config, waveConfig.spawnDistance)
            gameState.wave1EnemiesSpawned++
            console.log(
                `🛡️ Wave 1: Spawned enemy ${gameState.wave1EnemiesSpawned}/${waveConfig.enemyCount}`,
            )
        }

        // Check if all wave 1 enemies are defeated
        const aliveEnemies = this.getAliveEnemies(world, true) // exclude boss

        if (
            gameState.wave1EnemiesSpawned === waveConfig.enemyCount &&
            aliveEnemies.length === 0
        ) {
            console.log('🎮 Game State: Wave 1 Complete! Starting Wave 2')
            return 'enemiesWave2'
        }

        return null // Stay in current state
    }
}
