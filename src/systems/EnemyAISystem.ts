import { Vector2 } from 'three'
import type { RestrictedZoneConfig } from '../config/RestrictedZoneConfig'
import {
    calculatePushBackDirection,
    getRestrictedZoneAt,
} from '../config/RestrictedZoneConfig'
import type {
    InputComponent,
    PositionComponent,
    SpeedComponent,
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
            const speed = enemy.getComponent<SpeedComponent>('speed')

            if (!position || !weapon || !input || !speed) {
                continue
            }

            // Update AI behavior
            this.updateMovement(position, playerPosition, input, speed)

            // Only handle shooting for manual weapons - auto-targeting weapons are handled by WeaponSystem
            if (!weapon.isAutoTargeting) {
                this.updateShooting(position, weapon, playerPosition)
            }
        }
    }

    private updateMovement(
        position: PositionComponent,
        playerPosition: PositionComponent,
        input: InputComponent,
        speed: SpeedComponent,
    ): void {
        // Calculate direction to player
        const dx = playerPosition.x - position.x
        const dz = playerPosition.z - position.z
        const distanceToPlayer = Math.sqrt(dx * dx + dz * dz)

        // Apply speed reduction when near player
        this.applyProximitySpeedReduction(speed, distanceToPlayer)

        // Calculate base direction to player
        let targetDirection = new Vector2(dx, dz).normalize()

        // Check for restricted zones ahead and adjust direction
        targetDirection = this.avoidRestrictedZones(position, targetDirection)

        input.direction = targetDirection
        input.hasInput = true
    }

    /**
     * Reduce enemy speed when close to player to prevent ramming
     */
    private applyProximitySpeedReduction(
        speed: SpeedComponent,
        distanceToPlayer: number,
    ): void {
        const slowdownDistance = 8.0 // Distance at which to start slowing down
        const minSpeedRatio = 0.3 // Minimum speed as a ratio of max speed

        if (distanceToPlayer < slowdownDistance) {
            // Calculate speed reduction based on proximity
            const proximityRatio = distanceToPlayer / slowdownDistance
            const speedReduction =
                1.0 - (1.0 - minSpeedRatio) * (1.0 - proximityRatio)

            // Apply speed reduction by modifying max speed temporarily
            const originalMaxSpeed = speed.maxSpeed
            const reducedMaxSpeed = originalMaxSpeed * speedReduction

            // Clamp current speed to reduced max speed
            if (speed.currentSpeed > reducedMaxSpeed) {
                speed.currentSpeed = reducedMaxSpeed
            }
        }
    }

    /**
     * Check for restricted zones ahead and turn to avoid them
     */
    private avoidRestrictedZones(
        position: PositionComponent,
        targetDirection: Vector2,
    ): Vector2 {
        const lookAheadDistance = 8.0 // How far ahead to check for zones
        const checksCount = 3

        var maybeRestrictedZone: RestrictedZoneConfig | null = null
        for (let i = 1; i <= checksCount; i++) {
            // Calculate look-ahead position
            const lookAheadX =
                position.x +
                (targetDirection.x * lookAheadDistance * i) / checksCount
            const lookAheadZ =
                position.z +
                (targetDirection.y * lookAheadDistance * i) / checksCount

            // Check if there's a restricted zone ahead
            const restrictedZone = getRestrictedZoneAt(
                lookAheadX,
                lookAheadZ,
                position.y,
            )

            if (restrictedZone) {
                maybeRestrictedZone = restrictedZone
                break
            }
        }

        if (maybeRestrictedZone) {
            // Get push-back direction from the zone
            const pushBack = calculatePushBackDirection(
                position.x,
                position.z,
                maybeRestrictedZone,
            )

            // Convert push-back to avoidance direction
            // We want to turn perpendicular to the zone boundary
            const avoidanceDirection = new Vector2(-pushBack.z, pushBack.x)

            // Blend the avoidance direction with the original target direction
            const avoidanceWeight = 0.7 // How strongly to avoid vs pursue player
            const blendedDirection = new Vector2(
                targetDirection.x * (1 - avoidanceWeight) +
                    avoidanceDirection.x * avoidanceWeight,
                targetDirection.y * (1 - avoidanceWeight) +
                    avoidanceDirection.y * avoidanceWeight,
            )

            return blendedDirection.normalize()
        }

        return targetDirection
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
                weapon.lastShotTime = currentTime
            }
        }
    }
}
