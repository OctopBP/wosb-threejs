import type {
    EnemyAIComponent,
    HealthComponent,
    PositionComponent,
    VelocityComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'

import type { World } from '../ecs/World'

export class EnemyAISystem extends System {
    constructor(world: World) {
        super(world, ['enemy', 'enemyAI', 'position', 'velocity', 'weapon'])
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
        const playerHealth = player.getComponent<HealthComponent>('health')

        // Skip if player is dead or position not found
        if (!playerPosition || playerHealth?.isDead) {
            return
        }

        for (const enemy of enemies) {
            const enemyAI = enemy.getComponent<EnemyAIComponent>('enemyAI')
            const position = enemy.getComponent<PositionComponent>('position')
            const velocity = enemy.getComponent<VelocityComponent>('velocity')
            const weapon = enemy.getComponent<WeaponComponent>('weapon')

            if (!enemyAI || !position || !velocity || !weapon) continue

            // Update AI behavior
            this.updateMovement(enemyAI, position, velocity, playerPosition)

            // Only handle shooting for manual weapons - auto-targeting weapons are handled by WeaponSystem
            if (!weapon.isAutoTargeting) {
                this.updateShooting(enemyAI, position, weapon, playerPosition)
            }
        }
    }

    private updateMovement(
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
