import type {
    CollisionComponent,
    PositionComponent,
    VelocityComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class EnvironmentCollisionSystem extends System {
    constructor(world: World) {
        super(world, ['player', 'position', 'velocity', 'collision'])
    }

    update(deltaTime: number): void {
        const playerEntities = this.getEntities()
        const environmentEntities = this.world.getEntitiesWithComponents([
            'position',
            'collision',
        ])

        // Filter out environment entities (entities that have collision but no movement)
        const staticEnvironmentEntities = environmentEntities.filter(
            (entity) =>
                !entity.hasComponent('velocity') &&
                !entity.hasComponent('player'),
        )

        for (const player of playerEntities) {
            const playerPos = player.getComponent<PositionComponent>('position')
            const playerVel = player.getComponent<VelocityComponent>('velocity')
            const playerCol =
                player.getComponent<CollisionComponent>('collision')

            if (!playerPos || !playerVel || !playerCol) continue

            // Check collision with environment objects
            this.handleEnvironmentCollision(
                player.id,
                playerPos,
                playerVel,
                playerCol,
                staticEnvironmentEntities,
                deltaTime,
            )
        }
    }

    private handleEnvironmentCollision(
        playerId: number,
        playerPos: PositionComponent,
        playerVel: VelocityComponent,
        playerCol: CollisionComponent,
        environmentEntities: Entity[],
        deltaTime: number,
    ): void {
        // Calculate the predicted position based on current velocity
        const predictedX = playerPos.x + playerVel.dx * deltaTime
        const predictedZ = playerPos.z + playerVel.dz * deltaTime

        for (const envEntity of environmentEntities) {
            const envPos = envEntity.getComponent<PositionComponent>('position')
            const envCol =
                envEntity.getComponent<CollisionComponent>('collision')

            if (!envPos || !envCol) continue

            // Check collision at predicted position
            if (
                this.checkCollisionBetween(
                    { x: predictedX, y: playerPos.y, z: predictedZ },
                    playerCol,
                    envPos,
                    envCol,
                )
            ) {
                // Handle collision - prevent movement and apply sliding
                this.resolveCollision(
                    playerPos,
                    playerVel,
                    envPos,
                    envCol,
                    deltaTime,
                )
            }
        }
    }

    private checkCollisionBetween(
        pos1: { x: number; y: number; z: number },
        col1: CollisionComponent,
        pos2: PositionComponent,
        col2: CollisionComponent,
    ): boolean {
        // Apply offsets if specified
        const offset1 = col1.offset || { x: 0, y: 0, z: 0 }
        const offset2 = col2.offset || { x: 0, y: 0, z: 0 }

        const x1 = pos1.x + offset1.x
        const y1 = pos1.y + offset1.y
        const z1 = pos1.z + offset1.z

        const x2 = pos2.x + offset2.x
        const y2 = pos2.y + offset2.y
        const z2 = pos2.z + offset2.z

        // For simplicity, treat all collisions as sphere-sphere
        const radius1 = this.getEffectiveRadius(col1)
        const radius2 = this.getEffectiveRadius(col2)

        const dx = x1 - x2
        const dy = y1 - y2
        const dz = z1 - z2
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

        return distance < radius1 + radius2
    }

    private getEffectiveRadius(collision: CollisionComponent): number {
        if (collision.collider.shape === 'sphere') {
            return collision.collider.radius
        } else {
            // For box colliders, use the largest dimension as radius
            const box = collision.collider
            return Math.max(box.width, box.height, box.depth) / 2
        }
    }

    private resolveCollision(
        playerPos: PositionComponent,
        playerVel: VelocityComponent,
        envPos: PositionComponent,
        envCol: CollisionComponent,
        deltaTime: number,
    ): void {
        // Calculate direction from environment object to player
        const dx = playerPos.x - envPos.x
        const dz = playerPos.z - envPos.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        if (distance < 0.01) {
            // If too close, push player away in a random direction
            const angle = Math.random() * Math.PI * 2
            const pushX = Math.cos(angle)
            const pushZ = Math.sin(angle)

            const envRadius = this.getEffectiveRadius(envCol)
            const playerRadius = 1.0 // Approximate player radius
            const safeDistance = envRadius + playerRadius + 0.5

            playerPos.x = envPos.x + pushX * safeDistance
            playerPos.z = envPos.z + pushZ * safeDistance

            // Stop movement
            playerVel.dx = 0
            playerVel.dz = 0
            return
        }

        // Normalize the direction
        const dirX = dx / distance
        const dirZ = dz / distance

        // Calculate minimum safe distance
        const envRadius = this.getEffectiveRadius(envCol)
        const playerRadius = 1.0 // Approximate player radius
        const safeDistance = envRadius + playerRadius + 0.1

        // Push player to safe distance
        playerPos.x = envPos.x + dirX * safeDistance
        playerPos.z = envPos.z + dirZ * safeDistance

        // Calculate sliding - project velocity onto tangent
        const velocityMagnitude = Math.sqrt(
            playerVel.dx * playerVel.dx + playerVel.dz * playerVel.dz,
        )

        if (velocityMagnitude > 0.01) {
            // Get velocity direction
            const velDirX = playerVel.dx / velocityMagnitude
            const velDirZ = playerVel.dz / velocityMagnitude

            // Calculate collision normal (from environment to player)
            const normalX = dirX
            const normalZ = dirZ

            // Calculate dot product of velocity and normal
            const dot = velDirX * normalX + velDirZ * normalZ

            // If moving toward the obstacle, apply sliding
            if (dot < 0) {
                // Calculate tangent (perpendicular to normal)
                const tangentX = -normalZ
                const tangentZ = normalX

                // Project velocity onto tangent for sliding
                const tangentDot = velDirX * tangentX + velDirZ * tangentZ

                // Apply sliding with reduced speed
                const slideMultiplier = 0.7
                playerVel.dx =
                    tangentX * tangentDot * velocityMagnitude * slideMultiplier
                playerVel.dz =
                    tangentZ * tangentDot * velocityMagnitude * slideMultiplier
            }
        } else {
            // No velocity, just stop
            playerVel.dx = 0
            playerVel.dz = 0
        }
    }
}
