import type {
    InputComponent,
    MovementConfigComponent,
    PhysicsComponent,
    PositionComponent,
    VelocityComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class PhysicsMovementSystem extends System {
    constructor(world: World) {
        super(world, ['position', 'velocity', 'physics', 'alive'])
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const velocity = entity.getComponent<VelocityComponent>('velocity')
            const physics = entity.getComponent<PhysicsComponent>('physics')

            if (!position || !velocity || !physics) continue

            // Skip kinematic objects (they don't respond to physics)
            if (physics.isKinematic) continue

            // Apply input forces (if entity has input component)
            const input = entity.getComponent<InputComponent>('input')
            const movementConfig =
                entity.getComponent<MovementConfigComponent>('movementConfig')

            if (input && movementConfig) {
                this.applyInputForces(
                    velocity,
                    physics,
                    input,
                    movementConfig,
                    deltaTime,
                )
            }

            // Apply physics forces
            this.applyFriction(velocity, physics, deltaTime)
            this.applyDrag(velocity, physics, deltaTime)
            this.applyCollisionForces(velocity, physics, deltaTime)

            // Update position based on velocity
            this.updatePosition(position, velocity, deltaTime)

            // Clear collision forces after applying them
            physics.lastCollisionForce.x = 0
            physics.lastCollisionForce.y = 0
            physics.lastCollisionForce.z = 0
        }
    }

    private applyInputForces(
        velocity: VelocityComponent,
        physics: PhysicsComponent,
        input: InputComponent,
        config: MovementConfigComponent,
        deltaTime: number,
    ): void {
        if (!input.hasInput) return

        // Calculate force from input (F = ma, so a = F/m)
        const force = config.accelerationForce
        const acceleration = force / physics.mass

        // Apply forces based on input direction
        const forceX = input.direction.x * acceleration * deltaTime
        const forceZ = input.direction.y * acceleration * deltaTime

        velocity.dx += forceX
        velocity.dz += forceZ

        // Apply maximum speed limit
        this.enforceMaxSpeed(velocity, config)
    }

    private applyFriction(
        velocity: VelocityComponent,
        physics: PhysicsComponent,
        deltaTime: number,
    ): void {
        // Apply friction as a force that opposes motion
        const frictionForce = physics.friction
        const frictionAcceleration = frictionForce / physics.mass

        // Calculate friction magnitude based on velocity
        const velocityMagnitude = Math.sqrt(
            velocity.dx ** 2 + velocity.dy ** 2 + velocity.dz ** 2,
        )

        if (velocityMagnitude > 0.001) {
            // Normalize velocity to get direction
            const normalizedVx = velocity.dx / velocityMagnitude
            const normalizedVy = velocity.dy / velocityMagnitude
            const normalizedVz = velocity.dz / velocityMagnitude

            // Apply friction in opposite direction of movement
            const frictionX = -normalizedVx * frictionAcceleration * deltaTime
            const frictionY = -normalizedVy * frictionAcceleration * deltaTime
            const frictionZ = -normalizedVz * frictionAcceleration * deltaTime

            // Don't let friction reverse direction
            if (Math.abs(frictionX) < Math.abs(velocity.dx)) {
                velocity.dx += frictionX
            } else {
                velocity.dx = 0
            }

            if (Math.abs(frictionY) < Math.abs(velocity.dy)) {
                velocity.dy += frictionY
            } else {
                velocity.dy = 0
            }

            if (Math.abs(frictionZ) < Math.abs(velocity.dz)) {
                velocity.dz += frictionZ
            } else {
                velocity.dz = 0
            }
        }
    }

    private applyDrag(
        velocity: VelocityComponent,
        physics: PhysicsComponent,
        deltaTime: number,
    ): void {
        // Drag force is proportional to velocity squared
        const dragCoeff = physics.drag
        const speedSquared =
            velocity.dx ** 2 + velocity.dy ** 2 + velocity.dz ** 2

        if (speedSquared > 0.001) {
            const speed = Math.sqrt(speedSquared)
            const dragMagnitude = (dragCoeff * speedSquared) / physics.mass
            const dragAcceleration = dragMagnitude * deltaTime

            // Apply drag in opposite direction of velocity
            const normalizedVx = velocity.dx / speed
            const normalizedVy = velocity.dy / speed
            const normalizedVz = velocity.dz / speed

            velocity.dx -= normalizedVx * dragAcceleration
            velocity.dy -= normalizedVy * dragAcceleration
            velocity.dz -= normalizedVz * dragAcceleration
        }
    }

    private applyCollisionForces(
        velocity: VelocityComponent,
        physics: PhysicsComponent,
        deltaTime: number,
    ): void {
        // Apply collision forces (these are set by the collision system)
        const acceleration = 1 / physics.mass

        velocity.dx += physics.lastCollisionForce.x * acceleration * deltaTime
        velocity.dy += physics.lastCollisionForce.y * acceleration * deltaTime
        velocity.dz += physics.lastCollisionForce.z * acceleration * deltaTime
    }

    private updatePosition(
        position: PositionComponent,
        velocity: VelocityComponent,
        deltaTime: number,
    ): void {
        // Update linear position
        position.x += velocity.dx * deltaTime
        position.y += velocity.dy * deltaTime
        position.z += velocity.dz * deltaTime

        // Update angular position
        position.rotationX += velocity.angularVelocityX * deltaTime
        position.rotationY += velocity.angularVelocityY * deltaTime
        position.rotationZ += velocity.angularVelocityZ * deltaTime
    }

    private enforceMaxSpeed(
        velocity: VelocityComponent,
        config: MovementConfigComponent,
    ): void {
        const currentSpeed = Math.sqrt(
            velocity.dx ** 2 + velocity.dy ** 2 + velocity.dz ** 2,
        )

        if (currentSpeed > config.maxSpeed) {
            const scale = config.maxSpeed / currentSpeed
            velocity.dx *= scale
            velocity.dy *= scale
            velocity.dz *= scale
        }
    }
}
