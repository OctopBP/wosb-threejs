import type { GameStateConfig } from '../../config/GameStateConfig'
import type {
    CameraTargetComponent,
    GameStateComponent,
    InputComponent,
} from '../../ecs/Component'
import type { World } from '../../ecs/World'
import { BaseGameState } from './BaseGameState'

export class BossPreviewState extends BaseGameState {
    private startTime: number = 0
    private previewDuration: number = 1.0 // 1 second as requested
    private hasStoppedMovement: boolean = false
    private hasSetCameraTarget: boolean = false

    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
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

        // Set camera to focus on boss if not already done
        if (!this.hasSetCameraTarget) {
            this.setCameraToBoss(world)
            this.hasSetCameraTarget = true
        }

        // Check if preview duration has elapsed
        const currentTime = performance.now() / 1000
        const elapsedTime = currentTime - this.startTime

        if (elapsedTime >= this.previewDuration) {
            // Reset camera target priority to normal before transitioning
            this.resetCameraTarget(world)

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

    private setCameraToBoss(world: World): void {
        // Find boss entity by looking for entities with boss component
        const bossEntities = world.getEntitiesWithComponent('boss')

        for (const boss of bossEntities) {
            // Add or update camera target component with high priority
            const existingTarget =
                boss.getComponent<CameraTargetComponent>('cameraTarget')
            if (existingTarget) {
                existingTarget.priority = 100 // High priority for boss preview
                existingTarget.targetType = 'boss'
                existingTarget.customCameraState = 'bossPreview'
            } else {
                const cameraTarget: CameraTargetComponent = {
                    type: 'cameraTarget',
                    priority: 100, // High priority to override player camera
                    targetType: 'boss',
                    offset: { x: 0, y: 0, z: 0 },
                    customCameraState: 'bossPreview',
                }
                boss.addComponent(cameraTarget)
            }
            break // Only need to set camera for the first boss found
        }
    }

    private resetCameraTarget(world: World): void {
        // Reset boss camera target priority to normal level
        const bossEntities = world.getEntitiesWithComponent('boss')

        for (const boss of bossEntities) {
            const cameraTarget =
                boss.getComponent<CameraTargetComponent>('cameraTarget')
            if (cameraTarget) {
                cameraTarget.priority = 50 // Normal priority (player is typically 10)
                cameraTarget.customCameraState = undefined // Remove custom state
            }
            break
        }
    }
}
