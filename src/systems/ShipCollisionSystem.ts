import type {
    CollisionComponent,
    PhysicsComponent,
    PositionComponent,
    VelocityComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

interface CollisionPair {
    entityA: Entity
    entityB: Entity
    collision: CollisionResult
}

interface CollisionResult {
    hasCollision: boolean
    penetrationDepth: number
    normal: { x: number; y: number; z: number }
    contactPoint: { x: number; y: number; z: number }
}

export class ShipCollisionSystem extends System {
    constructor(world: World) {
        super(world, []) // We'll manually query for ships with physics and collision components
    }

    update(_deltaTime: number): void {
        // Get all ships that can collide (have physics, collision, and position components)
        const ships = this.world.getEntitiesWithComponents([
            'position',
            'velocity',
            'physics',
            'collision',
            'alive',
        ])

        // Check collisions between all ship pairs
        const collisionPairs: CollisionPair[] = []

        for (let i = 0; i < ships.length; i++) {
            for (let j = i + 1; j < ships.length; j++) {
                const shipA = ships[i]
                const shipB = ships[j]

                const collision = this.checkShipCollision(shipA, shipB)
                if (collision.hasCollision) {
                    collisionPairs.push({
                        entityA: shipA,
                        entityB: shipB,
                        collision,
                    })
                }
            }
        }

        // Resolve all collisions
        for (const pair of collisionPairs) {
            this.resolveCollision(pair.entityA, pair.entityB, pair.collision)
        }
    }

    private checkShipCollision(
        entityA: Entity,
        entityB: Entity,
    ): CollisionResult {
        const posA = entityA.getComponent<PositionComponent>('position')
        const posB = entityB.getComponent<PositionComponent>('position')
        const collisionA = entityA.getComponent<CollisionComponent>('collision')
        const collisionB = entityB.getComponent<CollisionComponent>('collision')

        if (!posA || !posB || !collisionA || !collisionB) {
            return {
                hasCollision: false,
                penetrationDepth: 0,
                normal: { x: 0, y: 0, z: 0 },
                contactPoint: { x: 0, y: 0, z: 0 },
            }
        }

        // Apply collision offsets
        const offsetA = collisionA.offset || { x: 0, y: 0, z: 0 }
        const offsetB = collisionB.offset || { x: 0, y: 0, z: 0 }

        const centerA = {
            x: posA.x + offsetA.x,
            y: posA.y + offsetA.y,
            z: posA.z + offsetA.z,
        }

        const centerB = {
            x: posB.x + offsetB.x,
            y: posB.y + offsetB.y,
            z: posB.z + offsetB.z,
        }

        // For now, we'll support sphere-sphere and box-box collisions
        if (
            collisionA.collider.shape === 'sphere' &&
            collisionB.collider.shape === 'sphere'
        ) {
            return this.checkSphereCollision(
                centerA,
                centerB,
                collisionA.collider.radius,
                collisionB.collider.radius,
            )
        } else if (
            collisionA.collider.shape === 'box' &&
            collisionB.collider.shape === 'box'
        ) {
            return this.checkBoxCollision(
                centerA,
                centerB,
                collisionA.collider,
                collisionB.collider,
            )
        } else {
            // Mixed collision types - convert to sphere collision for simplicity
            const radiusA =
                collisionA.collider.shape === 'sphere'
                    ? collisionA.collider.radius
                    : Math.max(
                          collisionA.collider.width,
                          collisionA.collider.depth,
                      ) / 2

            const radiusB =
                collisionB.collider.shape === 'sphere'
                    ? collisionB.collider.radius
                    : Math.max(
                          collisionB.collider.width,
                          collisionB.collider.depth,
                      ) / 2

            return this.checkSphereCollision(centerA, centerB, radiusA, radiusB)
        }
    }

    private checkSphereCollision(
        centerA: { x: number; y: number; z: number },
        centerB: { x: number; y: number; z: number },
        radiusA: number,
        radiusB: number,
    ): CollisionResult {
        const dx = centerB.x - centerA.x
        const dy = centerB.y - centerA.y
        const dz = centerB.z - centerA.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
        const minDistance = radiusA + radiusB

        if (distance < minDistance && distance > 0) {
            const penetrationDepth = minDistance - distance
            const normal = {
                x: dx / distance,
                y: dy / distance,
                z: dz / distance,
            }
            const contactPoint = {
                x: centerA.x + normal.x * radiusA,
                y: centerA.y + normal.y * radiusA,
                z: centerA.z + normal.z * radiusA,
            }

            return {
                hasCollision: true,
                penetrationDepth,
                normal,
                contactPoint,
            }
        }

        return {
            hasCollision: false,
            penetrationDepth: 0,
            normal: { x: 0, y: 0, z: 0 },
            contactPoint: { x: 0, y: 0, z: 0 },
        }
    }

    private checkBoxCollision(
        centerA: { x: number; y: number; z: number },
        centerB: { x: number; y: number; z: number },
        boxA: { width: number; height: number; depth: number },
        boxB: { width: number; height: number; depth: number },
    ): CollisionResult {
        // AABB (Axis-Aligned Bounding Box) collision detection
        const halfWidthA = boxA.width / 2
        const halfHeightA = boxA.height / 2
        const halfDepthA = boxA.depth / 2

        const halfWidthB = boxB.width / 2
        const halfHeightB = boxB.height / 2
        const halfDepthB = boxB.depth / 2

        const dx = Math.abs(centerA.x - centerB.x)
        const dy = Math.abs(centerA.y - centerB.y)
        const dz = Math.abs(centerA.z - centerB.z)

        const overlapX = halfWidthA + halfWidthB - dx
        const overlapY = halfHeightA + halfHeightB - dy
        const overlapZ = halfDepthA + halfDepthB - dz

        if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
            // Find the axis with minimum overlap for separation
            let minOverlap = overlapX
            let normal = { x: centerB.x > centerA.x ? 1 : -1, y: 0, z: 0 }

            if (overlapY < minOverlap) {
                minOverlap = overlapY
                normal = { x: 0, y: centerB.y > centerA.y ? 1 : -1, z: 0 }
            }

            if (overlapZ < minOverlap) {
                minOverlap = overlapZ
                normal = { x: 0, y: 0, z: centerB.z > centerA.z ? 1 : -1 }
            }

            const contactPoint = {
                x: centerA.x + normal.x * halfWidthA,
                y: centerA.y + normal.y * halfHeightA,
                z: centerA.z + normal.z * halfDepthA,
            }

            return {
                hasCollision: true,
                penetrationDepth: minOverlap,
                normal,
                contactPoint,
            }
        }

        return {
            hasCollision: false,
            penetrationDepth: 0,
            normal: { x: 0, y: 0, z: 0 },
            contactPoint: { x: 0, y: 0, z: 0 },
        }
    }

    private resolveCollision(
        entityA: Entity,
        entityB: Entity,
        collision: CollisionResult,
    ): void {
        const posA = entityA.getComponent<PositionComponent>('position')
        const posB = entityB.getComponent<PositionComponent>('position')
        const velA = entityA.getComponent<VelocityComponent>('velocity')
        const velB = entityB.getComponent<VelocityComponent>('velocity')
        const physicsA = entityA.getComponent<PhysicsComponent>('physics')
        const physicsB = entityB.getComponent<PhysicsComponent>('physics')

        if (!posA || !posB || !velA || !velB || !physicsA || !physicsB) return

        // Skip if either entity doesn't respond to collisions
        if (
            !physicsA.enableCollisionResponse ||
            !physicsB.enableCollisionResponse
        )
            return

        // Separate overlapping objects
        this.separateObjects(posA, posB, physicsA, physicsB, collision)

        // Apply collision response forces
        this.applyCollisionResponse(velA, velB, physicsA, physicsB, collision)
    }

    private separateObjects(
        posA: PositionComponent,
        posB: PositionComponent,
        physicsA: PhysicsComponent,
        physicsB: PhysicsComponent,
        collision: CollisionResult,
    ): void {
        const totalMass = physicsA.mass + physicsB.mass
        const separationA =
            (physicsB.mass / totalMass) * collision.penetrationDepth
        const separationB =
            (physicsA.mass / totalMass) * collision.penetrationDepth

        // Move objects apart along collision normal
        if (!physicsA.isKinematic) {
            posA.x -= collision.normal.x * separationA
            posA.y -= collision.normal.y * separationA
            posA.z -= collision.normal.z * separationA
        }

        if (!physicsB.isKinematic) {
            posB.x += collision.normal.x * separationB
            posB.y += collision.normal.y * separationB
            posB.z += collision.normal.z * separationB
        }
    }

    private applyCollisionResponse(
        velA: VelocityComponent,
        velB: VelocityComponent,
        physicsA: PhysicsComponent,
        physicsB: PhysicsComponent,
        collision: CollisionResult,
    ): void {
        // Calculate relative velocity
        const relativeVelocity = {
            x: velB.dx - velA.dx,
            y: velB.dy - velA.dy,
            z: velB.dz - velA.dz,
        }

        // Calculate relative velocity along collision normal
        const velocityAlongNormal =
            relativeVelocity.x * collision.normal.x +
            relativeVelocity.y * collision.normal.y +
            relativeVelocity.z * collision.normal.z

        // Don't resolve if velocities are separating
        if (velocityAlongNormal > 0) return

        // Calculate restitution (average of both objects)
        const restitution = (physicsA.restitution + physicsB.restitution) / 2

        // Calculate impulse scalar
        const j = -(1 + restitution) * velocityAlongNormal
        const impulse = j / (1 / physicsA.mass + 1 / physicsB.mass)

        // Apply impulse to velocities
        const impulseVector = {
            x: impulse * collision.normal.x,
            y: impulse * collision.normal.y,
            z: impulse * collision.normal.z,
        }

        if (!physicsA.isKinematic) {
            velA.dx -= impulseVector.x / physicsA.mass
            velA.dy -= impulseVector.y / physicsA.mass
            velA.dz -= impulseVector.z / physicsA.mass
        }

        if (!physicsB.isKinematic) {
            velB.dx += impulseVector.x / physicsB.mass
            velB.dy += impulseVector.y / physicsB.mass
            velB.dz += impulseVector.z / physicsB.mass
        }

        // Store collision forces for additional effects
        physicsA.lastCollisionForce.x = -impulseVector.x
        physicsA.lastCollisionForce.y = -impulseVector.y
        physicsA.lastCollisionForce.z = -impulseVector.z

        physicsB.lastCollisionForce.x = impulseVector.x
        physicsB.lastCollisionForce.y = impulseVector.y
        physicsB.lastCollisionForce.z = impulseVector.z
    }
}
