import type { GameStateConfig } from '../../config/GameStateConfig'
import type { GameStateComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import { BaseGameState } from './BaseGameState'

export class BossFightState extends BaseGameState {
    private gameStartTime: number = 0

    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
        gameWorld: import('../../GameWorld').GameWorld,
    ): string | null {
        // Initialize game start time if not set
        if (this.gameStartTime === 0) {
            this.gameStartTime = performance.now() / 1000
        }

        // Spawn boss if not already spawned
        if (!gameState.bossSpawned) {
            this.spawnBoss(world, config)
            gameState.bossSpawned = true
        }

        // Boss fight continues until player dies or boss is defeated
        // Player death is handled by the main GameStateSystem
        // Boss death would lead to victory (not implemented yet in requirements)

        return null // Stay in current state
    }
}
