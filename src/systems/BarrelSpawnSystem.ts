import type { PositionComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import { spawnBarrelsAroundPosition } from '../entities/BarrelFactory'

export class BarrelSpawnSystem extends System {
    constructor(world: World) {
        super(world, ['spawnBarrel', 'position'])
    }

    update(_deltaTime: number): void {
        const spawnBarrels = this.getEntities()

        for (const spawnBarrelsEntity of spawnBarrels) {
            const enemyPosition =
                spawnBarrelsEntity.getComponent<PositionComponent>('position')
            if (!enemyPosition) continue

            // Check if it's a boss or regular enemy
            const isBoss = spawnBarrelsEntity.hasComponent('boss')

            // Spawn barrels around the enemy's death position
            const barrels = spawnBarrelsAroundPosition(
                enemyPosition.x,
                enemyPosition.y,
                enemyPosition.z,
                isBoss,
            )

            // Add barrels to the world
            for (const barrel of barrels) {
                this.world.addEntity(barrel)
            }

            spawnBarrelsEntity.removeComponent('spawnBarrel')
        }
    }
}
