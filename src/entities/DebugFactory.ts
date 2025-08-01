import type { DebugComponent } from '../ecs/Component'
import { Entity } from '../ecs/Entity'
import type { World } from '../ecs/World'

export function createDebugEntity(world: World): Entity {
    const entity = new Entity()

    // Add debug component with default settings
    const debugComponent: DebugComponent = {
        type: 'debug',
        enabled: false, // Start disabled
        showShootingPoints: false,
        showCollisionShapes: false,
        showWeaponRange: false,
        showVelocityVectors: false,
        showRestrictedZones: false,
        showBoundaries: false,
    }

    entity.addComponent(debugComponent)
    world.addEntity(entity)

    return entity
}
