import { Vector2 } from 'three'
import { enemyAIConfig } from '../config/EnemyAIConfig'
import { getRestrictedZoneAt } from '../config/RestrictedZoneConfig'
import type {
    InputComponent,
    PositionComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class EnemyAISystem extends System {
    constructor(world: World) {
        super(world, ['enemy', 'position', 'input', 'speed', 'weapon', 'alive'])
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
            const position = enemy.getComponent<PositionComponent>('position')
            const weapon = enemy.getComponent<WeaponComponent>('weapon')
            const input = enemy.getComponent<InputComponent>('input')

            if (!position || !weapon || !input) {
                continue
            }

            // Update AI behavior with obstacle avoidance
            this.updateMovementWithObstacleAvoidance(
                position,
                playerPosition,
                input,
            )

            // Only handle shooting for manual weapons - auto-targeting weapons are handled by WeaponSystem
            if (!weapon.isAutoTargeting) {
                this.updateShooting(position, weapon, playerPosition)
            }
        }
    }

    private updateMovementWithObstacleAvoidance(
        position: PositionComponent,
        playerPosition: PositionComponent,
        input: InputComponent,
    ): void {
        // Try to find a clear path to the player
        const safeDirection = this.findSafeDirection(position, playerPosition)

        // Use the safe direction for movement
        input.direction = safeDirection
        input.hasInput = true
    }

    private findSafeDirection(
        enemyPosition: PositionComponent,
        playerPosition: PositionComponent,
    ): Vector2 {
        // Calculate direct direction to player
        const dx = playerPosition.x - enemyPosition.x
        const dz = playerPosition.z - enemyPosition.z
        const directDirection = new Vector2(dx, dz).normalize()

        // First, try the direct path
        if (!this.isPathBlocked(enemyPosition, directDirection)) {
            return directDirection
        }

        // If direct path is blocked, try alternative angles
        const baseAngle = Math.atan2(directDirection.y, directDirection.x)

        // Try angles to the right (positive offset)
        for (
            let i = 1;
            i <= enemyAIConfig.rayCasting.maxAngleAttempts / 2;
            i++
        ) {
            const rightAngle =
                baseAngle + i * enemyAIConfig.rayCasting.angleStep
            const rightDirection = new Vector2(
                Math.cos(rightAngle),
                Math.sin(rightAngle),
            )

            if (!this.isPathBlocked(enemyPosition, rightDirection)) {
                return rightDirection
            }
        }

        // Try angles to the left (negative offset)
        for (
            let i = 1;
            i <= enemyAIConfig.rayCasting.maxAngleAttempts / 2;
            i++
        ) {
            const leftAngle = baseAngle - i * enemyAIConfig.rayCasting.angleStep
            const leftDirection = new Vector2(
                Math.cos(leftAngle),
                Math.sin(leftAngle),
            )

            if (!this.isPathBlocked(enemyPosition, leftDirection)) {
                return leftDirection
            }
        }

        // If no clear path found, return the direct direction as fallback
        // The RestrictedZoneSystem will handle collision response
        return directDirection
    }

    private isPathBlocked(
        startPosition: PositionComponent,
        direction: Vector2,
    ): boolean {
        // Cast ray from enemy position in the given direction
        const maxSteps = Math.floor(
            enemyAIConfig.rayCasting.maxRayDistance /
                enemyAIConfig.rayCasting.rayStep,
        )

        for (let step = 1; step <= maxSteps; step++) {
            const distance = step * enemyAIConfig.rayCasting.rayStep
            const checkX = startPosition.x + direction.x * distance
            const checkZ = startPosition.z + direction.y * distance

            // Check if this point is inside a restricted zone
            const restrictedZone = getRestrictedZoneAt(
                checkX,
                checkZ,
                startPosition.y,
            )
            if (restrictedZone) {
                return true // Path is blocked
            }
        }

        return false // Path is clear
    }

    private updateShooting(
        position: PositionComponent,
        weapon: WeaponComponent,
        playerPosition: PositionComponent,
    ): void {
        // Calculate distance to player
        const dx = playerPosition.x - position.x
        const dz = playerPosition.z - position.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        // Only shoot if player is within range
        if (distance <= weapon.detectionRange) {
            const currentTime = performance.now() / 1000
            const timeSinceLastShot = currentTime - weapon.lastShotTime
            const fireInterval = 1 / weapon.fireRate

            // Check if enough time has passed since last shot
            if (timeSinceLastShot >= fireInterval) {
                // Enemy shooting is handled by WeaponSystem
                // We just need to update the last shot time
                weapon.lastShotTime = currentTime
            }
        }
    }
}
