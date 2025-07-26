import type {
    PositionComponent,
    RotationSpeedComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class RotationSystem extends System {
    constructor(world: World) {
        super(world, ['position', 'rotationSpeed', 'alive'])
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const rotationSpeed =
                entity.getComponent<RotationSpeedComponent>('rotationSpeed')

            if (!position || !rotationSpeed) continue

            this.updateRotation(position, rotationSpeed, deltaTime)
            this.normalizeRotation(position)
        }
    }

    private updateRotation(
        position: PositionComponent,
        rotationSpeed: RotationSpeedComponent,
        deltaTime: number,
    ): void {
        // Apply rotation speed to Y-axis rotation (turning)
        position.rotationY += rotationSpeed.currentRotationSpeed * deltaTime
    }

    private normalizeRotation(position: PositionComponent): void {
        position.rotationY = this.normalizeAngle(position.rotationY)
    }

    private normalizeAngle(angle: number): number {
        while (angle > Math.PI) angle -= 2 * Math.PI
        while (angle < -Math.PI) angle += 2 * Math.PI
        return angle
    }
}
