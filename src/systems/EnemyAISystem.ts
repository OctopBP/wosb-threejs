import { Vector2 } from 'three'
import type {
    InputComponent,
    PositionComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class EnemyAISystem extends System {
    constructor(world: World) {
        super(world, ['enemy', 'position', 'input', 'weapon', 'alive'])
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

            // Update AI behavior
            this.updateMovement(position, playerPosition, input)

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
    ): void {
        // Calculate direction to player
        const dx = playerPosition.x - position.x
        const dz = playerPosition.z - position.z

        input.direction = new Vector2(dx, dz).normalize()
        input.hasInput = true
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
