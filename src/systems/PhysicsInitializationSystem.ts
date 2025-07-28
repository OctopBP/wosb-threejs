import type {
    CollisionComponent,
    PhysicsBodyComponent,
    PositionComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { PhysicsSystem } from './PhysicsSystem'

export class PhysicsInitializationSystem extends System {
    private physicsSystem: PhysicsSystem | null = null

    constructor(world: World) {
        super(world, ['physicsBody', 'position', 'collision'])
    }

    setPhysicsSystem(physicsSystem: PhysicsSystem): void {
        this.physicsSystem = physicsSystem
    }

    update(_deltaTime: number): void {
        if (!this.physicsSystem) return

        const entities = this.getEntities()

        for (const entity of entities) {
            const physicsBody = entity.getComponent<PhysicsBodyComponent>('physicsBody')
            const position = entity.getComponent<PositionComponent>('position')
            const collision = entity.getComponent<CollisionComponent>('collision')

            if (!physicsBody || !position || !collision) continue

            // Skip if already initialized
            if (physicsBody.bodyHandle !== -1) continue

            // Validate collision data
            if (!collision.collider || typeof collision.collider.shape !== 'string') {
                console.warn('Invalid collision data for entity:', entity.id)
                continue
            }

            // Create physics body based on collision shape
            let bodyData: { bodyHandle: number; colliderHandle: number } | null = null

            if (collision.collider.shape === 'box') {
                // Validate box dimensions
                if (collision.collider.width <= 0 || collision.collider.height <= 0 || collision.collider.depth <= 0) {
                    console.warn('Invalid box dimensions for entity:', entity.id, collision.collider)
                    continue
                }

                bodyData = this.physicsSystem.createBoxBody(
                    { x: position.x, y: position.y, z: position.z },
                    {
                        width: collision.collider.width,
                        height: collision.collider.height,
                        depth: collision.collider.depth,
                    },
                    false, // Dynamic body for ships
                    entity.hasComponent('player') ? 1.2 : 1.0, // Slightly heavier player ship
                )
            }
            // Note: Sphere colliders could be added here in the future if needed

            if (bodyData) {
                physicsBody.bodyHandle = bodyData.bodyHandle
                physicsBody.colliderHandle = bodyData.colliderHandle
            }
        }
    }
}