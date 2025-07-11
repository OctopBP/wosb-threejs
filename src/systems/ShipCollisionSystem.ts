import type {
    CollisionComponent,
    PositionComponent,
    VelocityComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class ShipCollisionSystem extends System {
    constructor(world: World) {
        super(world, ['collision', 'position', 'velocity'])
    }

    update(_deltaTime: number): void {
        const entities = this.getEntities()

        // Check each entity against every other entity for collisions
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const entityA = entities[i]
                const entityB = entities[j]

                this.checkAndResolveCollision(entityA, entityB)
            }
        }
    }

    private checkAndResolveCollision(entityA: Entity, entityB: Entity): void {
        const posA = entityA.getComponent<PositionComponent>('position')
        const posB = entityB.getComponent<PositionComponent>('position')
        const collisionA = entityA.getComponent<CollisionComponent>('collision')
        const collisionB = entityB.getComponent<CollisionComponent>('collision')
        const velA = entityA.getComponent<VelocityComponent>('velocity')
        const velB = entityB.getComponent<VelocityComponent>('velocity')

        if (!posA || !posB || !collisionA || !collisionB || !velA || !velB) {
            return
        }

        // Calculate distance between entities
        const dx = posB.x - posA.x
        const dy = posB.y - posA.y
        const dz = posB.z - posA.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

        // Check if collision occurred
        const combinedRadius = collisionA.radius + collisionB.radius
        if (distance < combinedRadius && distance > 0) {
            this.resolveCollision(
                posA,
                posB,
                velA,
                velB,
                collisionA,
                collisionB,
                distance,
                dx,
                dy,
                dz,
                combinedRadius,
            )
        }
    }

    private resolveCollision(
        posA: PositionComponent,
        posB: PositionComponent,
        velA: VelocityComponent,
        velB: VelocityComponent,
        collisionA: CollisionComponent,
        collisionB: CollisionComponent,
        distance: number,
        dx: number,
        dy: number,
        dz: number,
        combinedRadius: number,
    ): void {
        // Normalize the collision direction
        const nx = dx / distance
        const ny = dy / distance
        const nz = dz / distance

        // Separate the objects to prevent overlap
        const overlap = combinedRadius - distance
        const separationA =
            overlap * (collisionB.mass / (collisionA.mass + collisionB.mass))
        const separationB =
            overlap * (collisionA.mass / (collisionA.mass + collisionB.mass))

        if (!collisionA.isStatic) {
            posA.x -= nx * separationA
            posA.y -= ny * separationA
            posA.z -= nz * separationA
        }

        if (!collisionB.isStatic) {
            posB.x += nx * separationB
            posB.y += ny * separationB
            posB.z += nz * separationB
        }

        // Calculate relative velocity
        const relativeVelX = velB.dx - velA.dx
        const relativeVelY = velB.dy - velA.dy
        const relativeVelZ = velB.dz - velA.dz

        // Calculate relative velocity along the collision normal
        const velocityAlongNormal =
            relativeVelX * nx + relativeVelY * ny + relativeVelZ * nz

        // Don't resolve if velocities are separating
        if (velocityAlongNormal > 0) return

        // Calculate restitution (bounciness)
        const restitution = Math.min(
            collisionA.restitution,
            collisionB.restitution,
        )

        // Calculate impulse scalar
        const impulse = -(1 + restitution) * velocityAlongNormal
        const impulsePerMass = impulse / (collisionA.mass + collisionB.mass)

        // Apply impulse to velocities
        const impulseX = impulsePerMass * nx
        const impulseY = impulsePerMass * ny
        const impulseZ = impulsePerMass * nz

        if (!collisionA.isStatic) {
            velA.dx -= impulseX * collisionB.mass
            velA.dy -= impulseY * collisionB.mass
            velA.dz -= impulseZ * collisionB.mass
        }

        if (!collisionB.isStatic) {
            velB.dx += impulseX * collisionA.mass
            velB.dy += impulseY * collisionA.mass
            velB.dz += impulseZ * collisionA.mass
        }

        // Apply damping to prevent excessive bouncing
        const dampingFactor = 0.8
        if (!collisionA.isStatic) {
            velA.dx *= dampingFactor
            velA.dy *= dampingFactor
            velA.dz *= dampingFactor
        }

        if (!collisionB.isStatic) {
            velB.dx *= dampingFactor
            velB.dy *= dampingFactor
            velB.dz *= dampingFactor
        }
    }
}
