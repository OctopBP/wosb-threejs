import { Vector2 } from 'three'
import type {
    InputComponent,
    MovementConfigComponent,
    PhysicsForceComponent,
    PositionComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class PhysicsMovementSystem extends System {
    constructor(world: World) {
        super(world, [
            'position',
            'input',
            'movementConfig',
            'physicsBody',
            'physicsForce',
            'alive',
        ])
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const input = entity.getComponent<InputComponent>('input')
            const config = entity.getComponent<MovementConfigComponent>('movementConfig')
            const physicsForce = entity.getComponent<PhysicsForceComponent>('physicsForce')

            if (!position || !input || !config || !physicsForce) {
                continue
            }

            if (input.hasInput) {
                this.applyMovementForces(
                    position,
                    input,
                    config,
                    physicsForce,
                    deltaTime,
                )
            }
            // Note: When there's no input, forces are automatically cleared by PhysicsSystem
            // The physics damping will naturally slow down the ship
        }
    }

    private applyMovementForces(
        position: PositionComponent,
        input: InputComponent,
        config: MovementConfigComponent,
        physicsForce: PhysicsForceComponent,
        deltaTime: number,
    ): void {
        if (input.direction.lengthSq() === 0) {
            return
        }

        const normalizedDirection = input.direction.normalize()

        // Get ship forward direction (ship model faces backwards by default)
        const forwardAngle = position.rotationY + Math.PI
        const shipForward = new Vector2(
            Math.sin(forwardAngle),
            Math.cos(forwardAngle),
        )

        // Calculate the orientation difference between ship forward and desired direction
        const orientation = this.calculateOrientation(shipForward, normalizedDirection)

        // Apply forward thrust force
        // The force is applied in the ship's forward direction
        const thrustForce = config.accelerationForce * normalizedDirection.length()
        
        // Convert to world coordinates (ship forward direction)
        physicsForce.forceX = Math.sin(forwardAngle) * thrustForce
        physicsForce.forceZ = Math.cos(forwardAngle) * thrustForce
        physicsForce.forceY = 0 // No vertical forces for ships

        // Apply torque to turn the ship towards the desired direction
        // Negative orientation because we want to turn towards the target direction
        const torqueStrength = config.rotationAcceleration * orientation
        physicsForce.torqueY = -torqueStrength

        // Clear other torque components
        physicsForce.torqueX = 0
        physicsForce.torqueZ = 0
    }

    private calculateOrientation(shipForward: Vector2, targetDirection: Vector2): number {
        // Calculate cross product and dot product for orientation
        const cross = shipForward.x * targetDirection.y - shipForward.y * targetDirection.x
        const dot = shipForward.x * targetDirection.x + shipForward.y * targetDirection.y

        // Return orientation value that indicates how much to turn
        return (Math.sign(cross) * (1 - dot)) / 2
    }
}