import type {
    CollisionComponent,
    MovementConfigComponent,
    PositionComponent,
    VelocityComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class MovementSystem extends System {
    constructor(world: World) {
        super(world, ['position', 'velocity', 'movementConfig', 'alive'])
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const velocity = entity.getComponent<VelocityComponent>('velocity')
            const config =
                entity.getComponent<MovementConfigComponent>('movementConfig')
            const collision =
                entity.getComponent<CollisionComponent>('collision')

            if (!position || !velocity || !config) continue

            // Calculate new position
            const newPosition = {
                x: position.x + velocity.dx * deltaTime,
                y: position.y + velocity.dy * deltaTime,
                z: position.z + velocity.dz * deltaTime,
            }

            // Check for collisions with static objects (like islands)
            if (
                collision &&
                this.wouldCollideWithStaticObjects(
                    entity,
                    newPosition,
                    collision,
                )
            ) {
                // Collision detected - don't apply movement and stop velocity
                velocity.dx = 0
                velocity.dz = 0
            } else {
                // No collision - apply movement
                this.updatePosition(position, velocity, deltaTime)
            }
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

    private wouldCollideWithStaticObjects(
        movingEntity: any,
        newPosition: { x: number; y: number; z: number },
        movingCollision: CollisionComponent,
    ): boolean {
        // Get all static objects with collision (like islands)
        const staticEntities = this.world
            .getEntitiesWithComponents(['position', 'collision'])
            .filter(
                (entity) =>
                    entity.id !== movingEntity.id && // Don't check collision with self
                    !entity.hasComponent('velocity') && // Static objects don't have velocity
                    !entity.hasComponent('projectile'), // Exclude projectiles
            )

        for (const staticEntity of staticEntities) {
            const staticPosition =
                staticEntity.getComponent<PositionComponent>('position')
            const staticCollision =
                staticEntity.getComponent<CollisionComponent>('collision')

            if (!staticPosition || !staticCollision) continue

            // Check if the new position would cause a collision
            if (
                this.checkCollision(
                    newPosition,
                    movingCollision,
                    staticPosition,
                    staticCollision,
                )
            ) {
                return true
            }
        }

        return false
    }

    private checkCollision(
        pos1: { x: number; y: number; z: number },
        collision1: CollisionComponent,
        pos2: PositionComponent,
        collision2: CollisionComponent,
    ): boolean {
        // Apply offsets
        const offset1 = collision1.offset || { x: 0, y: 0, z: 0 }
        const offset2 = collision2.offset || { x: 0, y: 0, z: 0 }

        const x1 = pos1.x + offset1.x
        const y1 = pos1.y + offset1.y
        const z1 = pos1.z + offset1.z

        const x2 = pos2.x + offset2.x
        const y2 = pos2.y + offset2.y
        const z2 = pos2.z + offset2.z

        // Box vs Box collision (most common case)
        if (
            collision1.collider.shape === 'box' &&
            collision2.collider.shape === 'box'
        ) {
            const halfWidth1 = collision1.collider.width / 2
            const halfHeight1 = collision1.collider.height / 2
            const halfDepth1 = collision1.collider.depth / 2

            const halfWidth2 = collision2.collider.width / 2
            const halfHeight2 = collision2.collider.height / 2
            const halfDepth2 = collision2.collider.depth / 2

            return (
                Math.abs(x1 - x2) < halfWidth1 + halfWidth2 &&
                Math.abs(y1 - y2) < halfHeight1 + halfHeight2 &&
                Math.abs(z1 - z2) < halfDepth1 + halfDepth2
            )
        }

        // Sphere vs Sphere collision
        if (
            collision1.collider.shape === 'sphere' &&
            collision2.collider.shape === 'sphere'
        ) {
            const radius1 = collision1.collider.radius
            const radius2 = collision2.collider.radius
            const distance = Math.sqrt(
                (x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2,
            )
            return distance < radius1 + radius2
        }

        // Box vs Sphere collision (sphere as collision1, box as collision2)
        if (
            collision1.collider.shape === 'sphere' &&
            collision2.collider.shape === 'box'
        ) {
            const radius = collision1.collider.radius
            const halfWidth = collision2.collider.width / 2
            const halfHeight = collision2.collider.height / 2
            const halfDepth = collision2.collider.depth / 2

            // Find closest point on box to sphere center
            const closestX = Math.max(
                x2 - halfWidth,
                Math.min(x1, x2 + halfWidth),
            )
            const closestY = Math.max(
                y2 - halfHeight,
                Math.min(y1, y2 + halfHeight),
            )
            const closestZ = Math.max(
                z2 - halfDepth,
                Math.min(z1, z2 + halfDepth),
            )

            const distance = Math.sqrt(
                (x1 - closestX) ** 2 +
                    (y1 - closestY) ** 2 +
                    (z1 - closestZ) ** 2,
            )
            return distance < radius
        }

        // Sphere vs Box collision (box as collision1, sphere as collision2)
        if (
            collision1.collider.shape === 'box' &&
            collision2.collider.shape === 'sphere'
        ) {
            const radius = collision2.collider.radius
            const halfWidth = collision1.collider.width / 2
            const halfHeight = collision1.collider.height / 2
            const halfDepth = collision1.collider.depth / 2

            // Find closest point on box to sphere center
            const closestX = Math.max(
                x1 - halfWidth,
                Math.min(x2, x1 + halfWidth),
            )
            const closestY = Math.max(
                y1 - halfHeight,
                Math.min(y2, y1 + halfHeight),
            )
            const closestZ = Math.max(
                z1 - halfDepth,
                Math.min(z2, z1 + halfDepth),
            )

            const distance = Math.sqrt(
                (x2 - closestX) ** 2 +
                    (y2 - closestY) ** 2 +
                    (z2 - closestZ) ** 2,
            )
            return distance < radius
        }

        return false
    }
}
