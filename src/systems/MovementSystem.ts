import type {
    MovementConfigComponent,
    PositionComponent,
    VelocityComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'

import type { World } from '../ecs/World'

export class MovementSystem extends System {
    constructor(world: World) {
        super(world, ['position', 'velocity', 'movementConfig'])
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const velocity = entity.getComponent<VelocityComponent>('velocity')
            const config =
                entity.getComponent<MovementConfigComponent>('movementConfig')

            if (!position || !velocity || !config) continue

            this.updatePosition(position, velocity, deltaTime)
        }
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
    }
}
