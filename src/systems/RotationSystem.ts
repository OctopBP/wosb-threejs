import type {
    InputComponent,
    MovementConfigComponent,
    PositionComponent,
    VelocityComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'

import type { World } from '../ecs/World'

export class RotationSystem extends System {
    constructor(world: World) {
        super(world, ['position', 'velocity', 'input', 'movementConfig'])
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const velocity = entity.getComponent<VelocityComponent>('velocity')
            const input = entity.getComponent<InputComponent>('input')
            const config =
                entity.getComponent<MovementConfigComponent>('movementConfig')

            if (!position || !velocity || !input || !config) continue

            this.processRotation(position, velocity, input, config, deltaTime)
            this.applyRotationDampening(velocity)
            this.updateRotation(position, velocity, deltaTime)
            this.normalizeRotation(position)
        }
    }

    private processRotation(
        position: PositionComponent,
        velocity: VelocityComponent,
        input: InputComponent,
        config: MovementConfigComponent,
        deltaTime: number,
    ): void {
        // Immediate rotation towards movement direction
        if (
            input.hasInput &&
            (input.direction.y !== 0 || input.direction.x !== 0)
        ) {
            // Calculate target angle based on movement direction
            const targetAngle = Math.atan2(input.direction.x, input.direction.y)
            const currentAngle = position.rotationY

            // Calculate the shortest rotation difference
            let angleDiff = targetAngle - currentAngle

            // Normalize the difference to [-π, π] for shortest path
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI

            // Apply immediate rotation with very strong force for instant alignment
            const immediateRotationStrength = config.autoRotationStrength // Much stronger
            const rotationStep =
                angleDiff * immediateRotationStrength * deltaTime

            // Apply the rotation directly to position for immediate effect
            position.rotationY += rotationStep

            // Clear angular velocity to prevent inertia
            velocity.angularVelocityY = 0
        } else {
            // No input - stop rotation immediately
            velocity.angularVelocityY = 0
        }
    }

    private applyRotationDampening(velocity: VelocityComponent): void {
        // Since we're using immediate rotation, we don't need much dampening
        // Just ensure angular velocity stays at zero for X and Z axes
        velocity.angularVelocityX = 0
        velocity.angularVelocityY = 0 // We handle Y rotation directly in processRotation
        velocity.angularVelocityZ = 0
    }

    private updateRotation(
        position: PositionComponent,
        velocity: VelocityComponent,
        deltaTime: number,
    ): void {
        // Only update X and Z rotations from angular velocity
        // Y rotation is handled directly in processRotation for immediate response
        position.rotationX += velocity.angularVelocityX * deltaTime
        position.rotationZ += velocity.angularVelocityZ * deltaTime
    }

    private normalizeRotation(position: PositionComponent): void {
        position.rotationX = this.normalizeAngle(position.rotationX)
        position.rotationY = this.normalizeAngle(position.rotationY)
        position.rotationZ = this.normalizeAngle(position.rotationZ)
    }

    private normalizeAngle(angle: number): number {
        while (angle > Math.PI) angle -= 2 * Math.PI
        while (angle < -Math.PI) angle += 2 * Math.PI
        return angle
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value))
    }
}
