import { Vector2 } from 'three'
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

            if (!position || !speed || !rotationSpeed || !input || !config) {
                continue
            }

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

        const orientation = vectorOrientationAndDifference(
            shipForward,
            normalizedDirection,
        )

        // Calculate speed acceleration based on forward alignment (dot product)
        const speedAcceleration =
            config.accelerationForce * normalizedDirection.length() * deltaTime
        speed.currentSpeed =
            speed.currentSpeed + Math.max(0.0, speedAcceleration)

        rotationSpeed.currentRotationSpeed =
            -orientation * config.rotationAcceleration
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

function vectorOrientationAndDifference(A: Vector2, B: Vector2): number {
    const cross = A.x * B.y - A.y * B.x
    return Math.sign(cross)
}
