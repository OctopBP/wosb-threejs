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
            this.enforceBoundaries(position, config)
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

    private enforceBoundaries(
        position: PositionComponent,
        config: MovementConfigComponent,
    ): void {
        const bounds = config.boundaries

        // Clamp position within boundaries
        position.x = Math.max(bounds.minX, Math.min(bounds.maxX, position.x))
        position.y = Math.max(bounds.minY, Math.min(bounds.maxY, position.y))
        position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, position.z))
    }
}
