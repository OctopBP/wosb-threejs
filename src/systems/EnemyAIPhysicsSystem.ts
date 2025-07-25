import type {
    EnemyAIComponent,
    PhysicsComponent,
    PositionComponent,
    VelocityComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class EnemyAIPhysicsSystem extends System {
    constructor(world: World) {
        super(world, [
            'enemy',
            'enemyAI',
            'position',
            'velocity',
            'physics',
            'weapon',
            'alive',
        ])
    }

    update(deltaTime: number): void {
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
            const position = enemy.getComponent<PositionComponent>('position')
            const velocity = enemy.getComponent<VelocityComponent>('velocity')
            const physics = enemy.getComponent<PhysicsComponent>('physics')
            const weapon = enemy.getComponent<WeaponComponent>('weapon')

            if (!enemyAI || !position || !velocity || !physics || !weapon)
                continue

            // Update AI behavior
            this.updateMovementPhysics(
                enemyAI,
                position,
                velocity,
                physics,
                playerPosition,
                deltaTime,
            )

            // Only handle shooting for manual weapons - auto-targeting weapons are handled by WeaponSystem
            if (!weapon.isAutoTargeting) {
                this.updateShooting(enemyAI, position, weapon, playerPosition)
            }
        }
    }

    private updateMovementPhysics(
        ai: EnemyAIComponent,
        position: PositionComponent,
        velocity: VelocityComponent,
        physics: PhysicsComponent,
        playerPosition: PositionComponent,
        deltaTime: number,
    ): void {
        // Calculate direction to player
        const dx = playerPosition.x - position.x
        const dz = playerPosition.z - position.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        if (distance > 0.1) {
            // Normalize direction
            const dirX = dx / distance
            const dirZ = dz / distance

            // Apply force towards player (physics-based approach)
            const moveForce = ai.moveSpeed * physics.mass // Force = mass * acceleration

            // Apply forces through physics system instead of directly setting velocity
            const forceX = dirX * moveForce * deltaTime
            const forceZ = dirZ * moveForce * deltaTime

            // Add forces to velocity (F = ma, so a = F/m, and v += a * dt)
            velocity.dx += forceX / physics.mass
            velocity.dz += forceZ / physics.mass

            // Face the player
            position.rotationY = Math.atan2(dirX, dirZ) + Math.PI

            // Apply some dampening to prevent overshooting
            const dampening = 0.9
            if (distance < 2.0) {
                // When close to player, apply more dampening
                velocity.dx *= dampening
                velocity.dz *= dampening
            }
        } else {
            // Apply braking force when very close to player
            const brakingForce = 0.8
            velocity.dx *= brakingForce
            velocity.dz *= brakingForce
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
