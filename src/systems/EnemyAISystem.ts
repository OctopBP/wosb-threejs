import type {
    EnemyAIComponent,
    PathfindingComponent,
    PositionComponent,
    VelocityComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { PathfindingSystem } from './PathfindingSystem'

export class EnemyAISystem extends System {
    private pathfindingSystem: PathfindingSystem | null = null

    constructor(world: World) {
        super(world, [
            'enemy',
            'enemyAI',
            'pathfinding',
            'position',
            'velocity',
            'weapon',
            'alive',
        ])
    }

    setPathfindingSystem(pathfindingSystem: PathfindingSystem): void {
        this.pathfindingSystem = pathfindingSystem
    }

    update(_deltaTime: number): void {
        const enemies = this.getEntities()
        const playerEntities = this.world.getEntitiesWithComponents(['player'])

        // Skip if no player found
        if (playerEntities.length === 0) {
            return
        }

        const player = playerEntities[0]
        const playerPosition =
            player.getComponent<PositionComponent>('position')

        // Skip if player is dead or position not found
        if (!playerPosition || !player.hasComponent('alive')) {
            return
        }

        for (const enemy of enemies) {
            const enemyAI = enemy.getComponent<EnemyAIComponent>('enemyAI')
            const pathfinding =
                enemy.getComponent<PathfindingComponent>('pathfinding')
            const position = enemy.getComponent<PositionComponent>('position')
            const velocity = enemy.getComponent<VelocityComponent>('velocity')
            const weapon = enemy.getComponent<WeaponComponent>('weapon')

            if (!enemyAI || !pathfinding || !position || !velocity || !weapon)
                continue

            // Update AI behavior with pathfinding
            this.updateMovementWithPathfinding(
                enemyAI,
                pathfinding,
                position,
                velocity,
                playerPosition,
            )

            // Only handle shooting for manual weapons - auto-targeting weapons are handled by WeaponSystem
            if (!weapon.isAutoTargeting) {
                this.updateShooting(enemyAI, position, weapon, playerPosition)
            }
        }
    }

    private updateMovementWithPathfinding(
        ai: EnemyAIComponent,
        pathfinding: PathfindingComponent,
        position: PositionComponent,
        velocity: VelocityComponent,
        playerPosition: PositionComponent,
    ): void {
        if (!this.pathfindingSystem) {
            // Fallback to direct movement if pathfinding system not available
            this.updateDirectMovement(ai, position, velocity, playerPosition)
            return
        }

        const currentTime = performance.now() / 1000

        // Check if we need to recalculate the path
        const shouldRecalculatePath =
            !pathfinding.currentPath ||
            currentTime - pathfinding.lastPathfindTime >
                pathfinding.pathfindingCooldown

        if (shouldRecalculatePath) {
            // Calculate new path to player
            const path = this.pathfindingSystem.findPath(
                position.x,
                position.z,
                playerPosition.x,
                playerPosition.z,
            )

            if (path && path.length > 1) {
                // Remove the first waypoint (current position)
                pathfinding.currentPath = path.slice(1)
                pathfinding.currentWaypointIndex = 0
                pathfinding.lastPathfindTime = currentTime
            } else {
                // No path found, use direct movement as fallback
                this.updateDirectMovement(
                    ai,
                    position,
                    velocity,
                    playerPosition,
                )
                return
            }
        }

        // Follow the current path
        if (pathfinding.currentPath && pathfinding.currentPath.length > 0) {
            this.followPath(ai, pathfinding, position, velocity)
        } else {
            // No path available, stop moving
            velocity.dx = 0
            velocity.dz = 0
        }
    }

    private followPath(
        ai: EnemyAIComponent,
        pathfinding: PathfindingComponent,
        position: PositionComponent,
        velocity: VelocityComponent,
    ): void {
        if (
            !pathfinding.currentPath ||
            pathfinding.currentWaypointIndex >= pathfinding.currentPath.length
        ) {
            velocity.dx = 0
            velocity.dz = 0
            return
        }

        const currentWaypoint =
            pathfinding.currentPath[pathfinding.currentWaypointIndex]

        // Calculate direction to current waypoint
        const dx = currentWaypoint.x - position.x
        const dz = currentWaypoint.z - position.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        // Check if we've reached the current waypoint
        if (distance <= pathfinding.waypointReachDistance) {
            pathfinding.currentWaypointIndex++

            // If we've reached the last waypoint, we're done
            if (
                pathfinding.currentWaypointIndex >=
                pathfinding.currentPath.length
            ) {
                velocity.dx = 0
                velocity.dz = 0
                return
            }

            // Move to next waypoint
            const nextWaypoint =
                pathfinding.currentPath[pathfinding.currentWaypointIndex]
            const nextDx = nextWaypoint.x - position.x
            const nextDz = nextWaypoint.z - position.z
            const nextDistance = Math.sqrt(nextDx * nextDx + nextDz * nextDz)

            if (nextDistance > 0.1) {
                const dirX = nextDx / nextDistance
                const dirZ = nextDz / nextDistance

                velocity.dx = dirX * ai.moveSpeed
                velocity.dz = dirZ * ai.moveSpeed

                // Face movement direction
                position.rotationY = Math.atan2(dirX, dirZ) + Math.PI
            }
        } else {
            // Move toward current waypoint
            if (distance > 0.1) {
                const dirX = dx / distance
                const dirZ = dz / distance

                velocity.dx = dirX * ai.moveSpeed
                velocity.dz = dirZ * ai.moveSpeed

                // Face movement direction
                position.rotationY = Math.atan2(dirX, dirZ) + Math.PI
            }
        }
    }

    private updateDirectMovement(
        ai: EnemyAIComponent,
        position: PositionComponent,
        velocity: VelocityComponent,
        playerPosition: PositionComponent,
    ): void {
        // Calculate direction to player
        const dx = playerPosition.x - position.x
        const dz = playerPosition.z - position.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        if (distance > 0.1) {
            // Normalize direction
            const dirX = dx / distance
            const dirZ = dz / distance

            // Apply movement towards player
            const moveForce = ai.moveSpeed
            velocity.dx = dirX * moveForce
            velocity.dz = dirZ * moveForce

            // Face the player
            position.rotationY = Math.atan2(dirX, dirZ) + Math.PI
        } else {
            // Stop moving if very close to player
            velocity.dx = 0
            velocity.dz = 0
        }
    }

    private updateShooting(
        ai: EnemyAIComponent,
        position: PositionComponent,
        weapon: WeaponComponent,
        playerPosition: PositionComponent,
    ): void {
        // Calculate distance to player
        const dx = playerPosition.x - position.x
        const dz = playerPosition.z - position.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        // Only shoot if player is within range
        if (distance <= ai.shootingRange) {
            const currentTime = performance.now() / 1000
            const timeSinceLastShot = currentTime - ai.lastShotTime
            const fireInterval = 1 / weapon.fireRate

            // Check if enough time has passed since last shot
            if (timeSinceLastShot >= fireInterval) {
                // Enemy shooting is handled by WeaponSystem
                // We just need to update the last shot time
                ai.lastShotTime = currentTime
                weapon.lastShotTime = currentTime
            }
        }
    }
}
