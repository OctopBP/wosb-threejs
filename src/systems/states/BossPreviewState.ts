import type { GameStateConfig } from '../../config/GameStateConfig'
import type { GameStateComponent, InputComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import { BaseGameState } from './BaseGameState'

export class BossPreviewState extends BaseGameState {
    private startTime: number = 0
    private previewDuration: number = 1.5 // 1.5 seconds to allow smooth transition to complete
    private hasStoppedMovement: boolean = false
    private hasSetCameraTarget: boolean = false

    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
        gameWorld: import('../../GameWorld').GameWorld,
    ): string | null {
        // Initialize start time on first update
        if (this.startTime === 0) {
            this.startTime = performance.now() / 1000
        }

        // Spawn boss if not already spawned
        if (!gameState.bossSpawned) {
            this.spawnBoss(world, config)
            gameState.bossSpawned = true
        }

        // Stop player movement on first update
        if (!this.hasStoppedMovement) {
            this.stopPlayerMovement(world)
            this.hasStoppedMovement = true
        }

        // Trigger smooth camera transition to boss preview if not already done
        if (!this.hasSetCameraTarget) {
            gameWorld.transitionToCameraState('bossPreview', 0.6) // 0.6 second smooth transition
            this.hasSetCameraTarget = true
        }

        // Check if preview duration has elapsed
        const currentTime = performance.now() / 1000
        const elapsedTime = currentTime - this.startTime

        if (elapsedTime >= this.previewDuration) {
            // Smoothly transition camera back to player focus
            gameWorld.transitionToCameraState('playerFocus', 0.4) // 0.4 second transition back

            // Reset flags for potential future use
            this.hasStoppedMovement = false
            this.hasSetCameraTarget = false
            this.startTime = 0

            // Transition to boss fight
            return 'bossFight'
        }

        return null // Stay in current state
    }

    private stopPlayerMovement(world: World): void {
        // Find player entity and disable input
        for (const entity of world.getEntitiesWithComponent('player')) {
            const input = entity.getComponent<InputComponent>('input')
            if (input) {
                // Stop all movement by resetting input state
                input.moveUp = false
                input.moveDown = false
                input.moveLeft = false
                input.moveRight = false
                input.direction.x = 0
                input.direction.y = 0
                input.hasInput = false
                input.isPointerDown = false
            }
        }
    }
}
