import { Vector2 } from 'three'
import type {
    InputComponent,
    PositionComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

// Island obstacle positions (extracted from islands.glb data)
const ISLAND_OBSTACLES = [
    { x: -32.9, z: -58.7, radius: 8.0 }, // s4
    { x: 44.9, z: -48.6, radius: 7.0 }, // s1
    { x: 37.3, z: 43.8, radius: 6.0 }, // s2
    { x: -28.6, z: 10.8, radius: 7.0 }, // s3
    { x: 42.5, z: -41.9, radius: 5.0 }, // m_1
    { x: 42.9, z: -33.8, radius: 4.0 }, // Additional island positions
    { x: -14.5, z: -31.5, radius: 4.5 }, // From restricted zones
    { x: -17.5, z: 7.5, radius: 5.5 }, // From restricted zones
    { x: 19.25, z: 15.75, radius: 3.0 }, // From restricted zones
]

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
            this.updateMovementWithAvoidance(position, playerPosition, input)

            // Only handle shooting for manual weapons - auto-targeting weapons are handled by WeaponSystem
            if (!weapon.isAutoTargeting) {
                this.updateShooting(position, weapon, playerPosition)
            }
        }
    }

    private updateMovementWithAvoidance(
        position: PositionComponent,
        playerPosition: PositionComponent,
        input: InputComponent,
    ): void {
        // Calculate base direction to player
        const toPlayerX = playerPosition.x - position.x
        const toPlayerZ = playerPosition.z - position.z
        const baseDirection = new Vector2(toPlayerX, toPlayerZ).normalize()

        // Calculate obstacle avoidance force
        const avoidanceForce = this.calculateAvoidanceForce(position)

        // Combine forces: stronger avoidance when close to obstacles
        const avoidanceStrength = Math.min(avoidanceForce.length() * 2.0, 1.0)
        const playerAttraction = 1.0 - avoidanceStrength * 0.8

        // Blend the forces
        const finalDirection = new Vector2()
        finalDirection.x = baseDirection.x * playerAttraction + avoidanceForce.x
        finalDirection.y = baseDirection.y * playerAttraction + avoidanceForce.y

        // Normalize the final direction
        if (finalDirection.length() > 0) {
            finalDirection.normalize()
        } else {
            // Fallback to base direction if forces cancel out
            finalDirection.copy(baseDirection)
        }

        input.direction = finalDirection
        input.hasInput = true
    }

    private calculateAvoidanceForce(position: PositionComponent): Vector2 {
        const avoidanceForce = new Vector2(0, 0)
        const lookAheadDistance = 12.0 // How far ahead to look for obstacles
        const maxAvoidanceForce = 1.5 // Maximum strength of avoidance

        for (const obstacle of ISLAND_OBSTACLES) {
            const obstacleX = obstacle.x
            const obstacleZ = obstacle.z
            const obstacleRadius = obstacle.radius

            // Calculate distance to obstacle
            const dx = position.x - obstacleX
            const dz = position.z - obstacleZ
            const distance = Math.sqrt(dx * dx + dz * dz)

            // Check if we're within the avoidance range
            const avoidanceRange = obstacleRadius + lookAheadDistance
            if (distance < avoidanceRange && distance > 0) {
                // Calculate avoidance direction (away from obstacle)
                const avoidDirection = new Vector2(dx / distance, dz / distance)

                // Calculate force strength (stronger when closer)
                const forceStrength =
                    maxAvoidanceForce * (1.0 - distance / avoidanceRange)

                // Add weighted avoidance force
                avoidanceForce.x += avoidDirection.x * forceStrength
                avoidanceForce.y += avoidDirection.y * forceStrength
            }
        }

        return avoidanceForce
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
