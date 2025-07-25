import type {
    InputComponent,
    MovementConfigComponent,
    PositionComponent,
    RotationSpeedComponent,
    SpeedComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class AccelerationSystem extends System {
    constructor(world: World) {
        super(world, [
            'position',
            'speed',
            'rotationSpeed',
            'input',
            'movementConfig',
            'alive',
        ])
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const speed = entity.getComponent<SpeedComponent>('speed')
            const rotationSpeed =
                entity.getComponent<RotationSpeedComponent>('rotationSpeed')
            const input = entity.getComponent<InputComponent>('input')
            const config =
                entity.getComponent<MovementConfigComponent>('movementConfig')

            if (!position || !speed || !rotationSpeed || !input || !config)
                continue

            if (input.hasInput) {
                this.applyAcceleration(
                    position,
                    speed,
                    rotationSpeed,
                    input,
                    config,
                    deltaTime,
                )
            } else {
                this.applyDeceleration(speed, rotationSpeed, config, deltaTime)
            }

            this.enforceMaxSpeed(speed, config)
            this.enforceMaxRotationSpeed(rotationSpeed, config)
        }
    }

    private applyAcceleration(
        position: PositionComponent,
        speed: SpeedComponent,
        rotationSpeed: RotationSpeedComponent,
        input: InputComponent,
        config: MovementConfigComponent,
        deltaTime: number,
    ): void {
        // Get target direction from input
        const targetDirection = {
            x: input.direction.x,
            z: input.direction.y, // Y input becomes Z direction in 3D space
        }

        // Normalize target direction
        const targetLength = Math.sqrt(
            targetDirection.x * targetDirection.x +
                targetDirection.z * targetDirection.z,
        )
        if (targetLength === 0) return

        const normalizedTarget = {
            x: targetDirection.x / targetLength,
            z: targetDirection.z / targetLength,
        }

        // Get ship forward direction (ship model faces backwards by default)
        const forwardAngle = position.rotationY + Math.PI
        const shipForward = {
            x: Math.sin(forwardAngle),
            z: Math.cos(forwardAngle),
        }

        // Calculate cross product between ship forward and target direction
        // In 2D (on XZ plane), cross product is: forward.x * target.z - forward.z * target.x
        const crossProduct =
            shipForward.x * normalizedTarget.z -
            shipForward.z * normalizedTarget.x

        // Calculate dot product for forward alignment
        const dotProduct =
            shipForward.x * normalizedTarget.x +
            shipForward.z * normalizedTarget.z

        // Calculate speed acceleration based on forward alignment (dot product)
        // More aligned = faster, perpendicular = slower
        const forwardAlignment = Math.max(0, dotProduct) // Only positive alignment contributes to speed
        const speedAcceleration =
            config.accelerationForce * forwardAlignment * deltaTime
        speed.currentSpeed += speedAcceleration

        // Calculate rotation speed based on cross product
        // Cross product tells us how much and in which direction to rotate
        const rotationAcceleration =
            config.rotationAcceleration * crossProduct * deltaTime
        rotationSpeed.currentRotationSpeed += rotationAcceleration

        // Apply rotation dampening to prevent oscillation
        rotationSpeed.currentRotationSpeed *=
            config.rotationDampening ** deltaTime
    }

    private applyDeceleration(
        speed: SpeedComponent,
        rotationSpeed: RotationSpeedComponent,
        config: MovementConfigComponent,
        deltaTime: number,
    ): void {
        const decelerationForce = config.decelerationForce * deltaTime

        // Decelerate speed
        const currentSpeed = Math.abs(speed.currentSpeed)
        if (currentSpeed > 0) {
            const deceleration = Math.min(decelerationForce, currentSpeed)
            speed.currentSpeed -= Math.sign(speed.currentSpeed) * deceleration
        }

        // Stop very small speeds to prevent jitter
        if (Math.abs(speed.currentSpeed) < 0.01) {
            speed.currentSpeed = 0
        }

        // Decelerate rotation
        const currentRotationSpeed = Math.abs(
            rotationSpeed.currentRotationSpeed,
        )
        if (currentRotationSpeed > 0) {
            const rotationDeceleration = Math.min(
                config.rotationAcceleration * deltaTime,
                currentRotationSpeed,
            )
            rotationSpeed.currentRotationSpeed -=
                Math.sign(rotationSpeed.currentRotationSpeed) *
                rotationDeceleration
        }

        // Stop very small rotation speeds to prevent jitter
        if (Math.abs(rotationSpeed.currentRotationSpeed) < 0.01) {
            rotationSpeed.currentRotationSpeed = 0
        }
    }

    private enforceMaxSpeed(
        speed: SpeedComponent,
        config: MovementConfigComponent,
    ): void {
        if (Math.abs(speed.currentSpeed) > config.maxSpeed) {
            speed.currentSpeed = Math.sign(speed.currentSpeed) * config.maxSpeed
        }
    }

    private enforceMaxRotationSpeed(
        rotationSpeed: RotationSpeedComponent,
        config: MovementConfigComponent,
    ): void {
        if (
            Math.abs(rotationSpeed.currentRotationSpeed) >
            config.maxRotationSpeed
        ) {
            rotationSpeed.currentRotationSpeed =
                Math.sign(rotationSpeed.currentRotationSpeed) *
                config.maxRotationSpeed
        }
    }
}
