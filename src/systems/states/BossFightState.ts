import type { GameStateConfig } from '../../config/GameStateConfig'
import type { GameStateComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import { BaseGameState } from './BaseGameState'

export class BossFightState extends BaseGameState {
    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
        levelingSystem: import('../LevelingSystem').LevelingSystem | null,
    ): string | null {
        // Spawn boss if not already spawned
        if (!gameState.bossSpawned) {
            this.spawnBoss(world, config)
            gameState.bossSpawned = true
            console.log('💀 Boss Fight: Boss spawned!')
        }

        // Boss fight continues until player dies or boss is defeated
        // Player death is handled by the main GameStateSystem
        // Boss death would lead to victory (not implemented yet in requirements)

        return null // Stay in current state
    }
}
