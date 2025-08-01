import type { GameStateConfig } from '../../config/GameStateConfig'
import type { GameStateComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import { BaseGameState } from './BaseGameState'

const CAMERA_TRANSITION_TIME = 1500

export class BossFightState extends BaseGameState {
    private gameStartTime: number = 0

    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
    ): string | null {
        // Initialize game start time if not set
        if (this.gameStartTime === 0) {
            this.gameStartTime = performance.now() / 1000
        }

        // Spawn boss if not already spawned
        if (!gameState.bossSpawned) {
            this.spawnBoss(world, config)
            gameState.bossSpawned = true

            setTimeout(() => {
                const bossEntities = world.getEntitiesWithComponents(['boss'])
                const bossEntity = bossEntities[0]
                bossEntity.removeComponent('cameraTarget')
            }, CAMERA_TRANSITION_TIME)
        }

        return null
    }
}
