import type * as BABYLON from 'babylonjs'
import type { Entity } from './ecs/Entity'
import { World } from './ecs/World'
import { PlayerFactory } from './entities/PlayerFactory'
import { AccelerationSystem } from './systems/AccelerationSystem'
import { InputSystem } from './systems/InputSystem'
import { MovementSystem } from './systems/MovementSystem'
import { RenderSystem } from './systems/RenderSystem'
import { RotationSystem } from './systems/RotationSystem'

export class GameWorld {
    private world: World
    private inputSystem: InputSystem
    private rotationSystem: RotationSystem
    private accelerationSystem: AccelerationSystem
    private movementSystem: MovementSystem
    private renderSystem: RenderSystem
    private playerEntity: Entity | null = null
    private lastTime: number = 0

    constructor(
        private scene: BABYLON.Scene,
        private canvas: HTMLCanvasElement,
    ) {
        this.world = new World()

        // Initialize systems in the correct order
        this.inputSystem = new InputSystem(this.world, canvas)
        this.rotationSystem = new RotationSystem(this.world)
        this.accelerationSystem = new AccelerationSystem(this.world)
        this.movementSystem = new MovementSystem(this.world)
        this.renderSystem = new RenderSystem(this.world, scene)

        // Add systems to world in execution order
        this.world.addSystem(this.inputSystem) // 1. Handle input events and process to direction
        this.world.addSystem(this.rotationSystem) // 2. Handle rotation
        this.world.addSystem(this.accelerationSystem) // 3. Apply acceleration/deceleration
        this.world.addSystem(this.movementSystem) // 4. Apply velocity to position
        this.world.addSystem(this.renderSystem) // 5. Render the results
    }

    init(): void {
        console.log('GameWorld: Initializing...')

        // Create player ship
        this.playerEntity = PlayerFactory.createPlayerShip()
        if (this.playerEntity) {
            this.world.addEntity(this.playerEntity)
            console.log(
                `GameWorld: Created player ship with entity ID ${this.playerEntity.id}`,
            )
        }

        console.log(
            'GameWorld: Controls - WASD/Arrow keys for direction, ship auto-rotates towards movement',
        )
        console.log(
            'GameWorld: Using unified input system with direction output',
        )
    }

    update(time: number): void {
        // Calculate delta time
        const deltaTime =
            this.lastTime === 0 ? 0 : (time - this.lastTime) / 1000
        this.lastTime = time

        // Clamp delta time to prevent large jumps
        const clampedDeltaTime = Math.min(deltaTime, 1 / 30) // Max 30 FPS minimum

        // Update all systems
        this.world.update(clampedDeltaTime)
    }

    getPlayerEntity(): Entity | null {
        return this.playerEntity
    }

    getEntityCount(): number {
        return this.world.getEntityCount()
    }

    // Configuration methods for tuning movement
    updatePlayerMovementConfig(overrides: any): void {
        if (this.playerEntity) {
            PlayerFactory.updateMovementConfig(this.playerEntity, overrides)
        }
    }

    // Debug methods
    getPlayerPosition(): { x: number; y: number; z: number } | null {
        if (!this.playerEntity) return null

        const position = this.playerEntity.getComponent('position') as any
        return position ? { x: position.x, y: position.y, z: position.z } : null
    }

    getPlayerVelocity(): { dx: number; dy: number; dz: number } | null {
        if (!this.playerEntity) return null

        const velocity = this.playerEntity.getComponent('velocity') as any
        return velocity
            ? { dx: velocity.dx, dy: velocity.dy, dz: velocity.dz }
            : null
    }

    getPlayerInputDirection(): {
        direction: { x: number; y: number }
        hasInput: boolean
    } | null {
        if (!this.playerEntity) return null

        const input = this.playerEntity.getComponent('input') as any
        return input
            ? {
                  direction: { x: input.direction.x, y: input.direction.y },
                  hasInput: input.hasInput,
              }
            : null
    }

    cleanup(): void {
        console.log('GameWorld: Cleaning up...')
        this.world.clear()
        this.playerEntity = null
    }
}
