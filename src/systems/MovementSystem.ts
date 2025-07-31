import type {
    MovementConfigComponent,
    PositionComponent,
    SpeedComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'

import type { World } from '../ecs/World'

export class MovementSystem extends System {
    constructor(world: World) {
        super(world, ['position', 'speed', 'movementConfig', 'alive'])
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const speed = entity.getComponent<SpeedComponent>('speed')
            const config =
                entity.getComponent<MovementConfigComponent>('movementConfig')

            if (!position || !speed || !config) {
                continue
            }

            this.updatePosition(position, speed, deltaTime)
        }
    }

    private updatePosition(
        position: PositionComponent,
        speed: SpeedComponent,
        deltaTime: number,
    ): void {
        if (speed.currentSpeed === 0) {
            return
        }

        // Calculate forward direction based on ship's Y rotation
        // Ship model faces backwards by default, so we add Math.PI
        const forwardAngle = position.rotationY + Math.PI
        const forwardX = Math.sin(forwardAngle)
        const forwardZ = Math.cos(forwardAngle)

        // Update position based on forward direction and current speed
        const movement = speed.currentSpeed * deltaTime
        position.x += forwardX * movement
        position.z += forwardZ * movement
    }
}
