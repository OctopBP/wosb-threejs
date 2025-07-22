import type { GameStateConfig } from '../../config/GameStateConfig'
import { getRandomSpawnDistanceForWaveOrBoss } from '../../config/GameStateConfig'
import type { GameStateComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import { BaseGameState } from './BaseGameState'

export class Wave2State extends BaseGameState {
    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
    ): string | null {
        const waveConfig = config.wave2

        // Spawn enemies for wave 2
        if (gameState.wave2EnemiesSpawned < waveConfig.enemyCount) {
            this.spawnEnemyAroundPlayer(
                world,
                config,
                getRandomSpawnDistanceForWaveOrBoss(waveConfig),
            )
            gameState.wave2EnemiesSpawned++
            console.log(
                `🛡️ Wave 2: Spawned enemy ${gameState.wave2EnemiesSpawned}/${waveConfig.enemyCount}`,
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
