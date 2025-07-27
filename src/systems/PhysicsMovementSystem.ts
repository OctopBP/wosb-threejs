import type {
    InputComponent,
    MovementConfigComponent,
    PhysicsBodyComponent,
    PositionComponent,
    SpeedComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { PhysicsSystem } from './PhysicsSystem'

export class PhysicsMovementSystem extends System {
    private physicsSystem: PhysicsSystem | null = null
    private movementForce = 50 // Base force for ship movement
    private maxSpeed = 5 // Maximum speed limit

    constructor(world: World) {
        super(world, [
            'physicsBody',
            'position',
            'speed',
            'input',
            'movementConfig',
            'alive',
        ])
    }

    setPhysicsSystem(physicsSystem: PhysicsSystem): void {
        this.physicsSystem = physicsSystem
    }

    update(_deltaTime: number): void {
        if (!this.physicsSystem) return

        const entities = this.getEntities()

        for (const entity of entities) {
            const physicsBody =
                entity.getComponent<PhysicsBodyComponent>('physicsBody')
            const position = entity.getComponent<PositionComponent>('position')
            const speed = entity.getComponent<SpeedComponent>('speed')
            const input = entity.getComponent<InputComponent>('input')
            const config =
                entity.getComponent<MovementConfigComponent>('movementConfig')

            if (
                !physicsBody?.body ||
                !position ||
                !speed ||
                !input ||
                !config
            ) {
                continue
            }

            // Apply movement forces based on input
            this.applyMovementForces(entity, physicsBody, input, config)

            // Apply rotation forces based on input
            this.applyRotationForces(entity, physicsBody, input, config)

            // Limit maximum speed
            this.limitSpeed(physicsBody, config.maxSpeed)

            // Apply drag to slow down ships when not accelerating
            this.applyDrag(physicsBody)
        }
    }

    private applyMovementForces(
        entity: any,
        physicsBody: PhysicsBodyComponent,
        input: InputComponent,
        config: MovementConfigComponent,
    ): void {
        if (!physicsBody.body) return

        // Calculate desired movement direction from input
        let forwardInput = 0
        let rightInput = 0

        // Handle keyboard input
        if (input.moveUp) forwardInput += 1
        if (input.moveDown) forwardInput -= 1
        if (input.moveLeft) rightInput -= 1
        if (input.moveRight) rightInput += 1

        // Handle processed direction input (from joystick or other input methods)
        if (input.hasInput && input.direction) {
            forwardInput += input.direction.y
            rightInput += input.direction.x
        }

        // No movement input, let drag handle deceleration
        if (forwardInput === 0 && rightInput === 0) {
            return
        }

        // Get ship's current rotation
        const currentRotation = physicsBody.body.quaternion

        // Calculate forward and right directions based on ship rotation
        const forward = new CANNON.Vec3(0, 0, 1)
        const right = new CANNON.Vec3(1, 0, 0)

        // Rotate vectors by ship's current rotation
        currentRotation.vmult(forward, forward)
        currentRotation.vmult(right, right)

        // Calculate movement force - use maxSpeed as acceleration approximation
        const baseForce = this.movementForce * (config.maxSpeed / 5)

        // Apply forces in world space
        const forceX =
            forward.x * forwardInput * baseForce +
            right.x * rightInput * baseForce
        const forceZ =
            forward.z * forwardInput * baseForce +
            right.z * rightInput * baseForce

        // Apply the force to the physics body
        physicsBody.body.force.x += forceX
        physicsBody.body.force.z += forceZ
    }

    private applyRotationForces(
        entity: any,
        physicsBody: PhysicsBodyComponent,
        input: InputComponent,
        config: MovementConfigComponent,
    ): void {
        if (!physicsBody.body) return

        let rotationInput = 0

        // Handle keyboard rotation input
        if (input.moveLeft) rotationInput += 1
        if (input.moveRight) rotationInput -= 1

        // Handle processed direction input for rotation
        if (input.hasInput && input.direction) {
            rotationInput += input.direction.x
        }

        if (rotationInput === 0) {
            // Apply rotational drag
            physicsBody.body.angularVelocity.y *= 0.9
            return
        }

        // Apply rotational force
        const rotationForce = rotationInput * config.maxRotationSpeed * 2
        physicsBody.body.angularVelocity.y += rotationForce * 0.016 // Approximate deltaTime

        // Limit angular velocity
        const maxAngularVel = config.maxRotationSpeed
        if (Math.abs(physicsBody.body.angularVelocity.y) > maxAngularVel) {
            physicsBody.body.angularVelocity.y =
                Math.sign(physicsBody.body.angularVelocity.y) * maxAngularVel
        }
    }

    private limitSpeed(
        physicsBody: PhysicsBodyComponent,
        maxSpeed: number,
    ): void {
        if (!physicsBody.body) return

        const velocity = physicsBody.body.velocity
        const speed = Math.sqrt(
            velocity.x * velocity.x + velocity.z * velocity.z,
        )

        if (speed > maxSpeed) {
            const scale = maxSpeed / speed
            velocity.x *= scale
            velocity.z *= scale
        }
    }

    private applyDrag(physicsBody: PhysicsBodyComponent): void {
        if (!physicsBody.body) return

        // Apply linear drag
        const dragFactor = 0.95
        physicsBody.body.velocity.x *= dragFactor
        physicsBody.body.velocity.z *= dragFactor

        // Apply angular drag
        physicsBody.body.angularVelocity.y *= 0.95
    }
}
