import type { GameStateConfig } from '../../config/GameStateConfig'
import type { GameStateComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import type { GameWorld } from '../../GameWorld'
import { BaseGameState } from './BaseGameState'

export class BossFightState extends BaseGameState {
    private bossSpawnTime: number = 0
    private hasReturnedCameraToPlayer: boolean = false
    private bossEntityId: number | null = null

    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
        gameWorld?: GameWorld,
    ): string | null {
        // Reset state variables if boss hasn't been spawned (e.g., after game restart)
        if (!gameState.bossSpawned) {
            this.bossSpawnTime = 0
            this.hasReturnedCameraToPlayer = false
            this.bossEntityId = null
        }

        // Spawn boss if not already spawned
        if (!gameState.bossSpawned) {
            const boss = this.spawnBoss(world, config, gameWorld)
            if (boss) {
                gameState.bossSpawned = true
                this.bossSpawnTime = Date.now()
                this.hasReturnedCameraToPlayer = false
                this.bossEntityId = boss.id
                console.log('💀 Boss Fight: Boss spawned!')
                console.log('📷 Camera focused on boss for dramatic entrance')
            }
        }

        // Check if 1 second has passed since boss spawn and return camera to player
        if (
            gameState.bossSpawned &&
            !this.hasReturnedCameraToPlayer &&
            this.bossEntityId !== null
        ) {
            const timeElapsed = Date.now() - this.bossSpawnTime
            if (timeElapsed >= 1000) {
                // 1 second
                if (gameWorld) {
                    // Remove camera target from boss to return focus to player
                    gameWorld.removeCameraTarget(this.bossEntityId)
                    console.log(
                        '📷 Camera returned to player after boss entrance',
                    )
                }
                this.hasReturnedCameraToPlayer = true
            }
        }

        // Boss fight continues until player dies or boss is defeated
        // Player death is handled by the main GameStateSystem
        // Boss death would lead to victory (not implemented yet in requirements)

        return null // Stay in current state
    }
}
