import { createBoxCollision } from '../config/CollisionConfig'
import type {
    CollisionComponent,
    PositionComponent,
    RenderableComponent,
} from '../ecs/Component'
import { Entity } from '../ecs/Entity'

export function createIsland(
    x: number,
    y: number,
    z: number,
    scale: number = 1.0,
): Entity {
    const entity = new Entity()

    // Position component - place at specified location
    const position: PositionComponent = {
        type: 'position',
        x,
        y,
        z,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
    }
    entity.addComponent(position)

    // Renderable component - use island GLTF model
    const renderable: RenderableComponent = {
        type: 'renderable',
        meshId: `island_${entity.id}`,
        mesh: undefined, // Will be created by RenderSystem
        meshType: 'island',
        visible: true,
        upgrades: {},
    }
    entity.addComponent(renderable)

    // Collision component - box collider scaled with the island
    // This makes the island a static rigidbody that blocks ships
    const collision: CollisionComponent = createBoxCollision(
        8.0 * scale, // width - scaled island collision box
        4.0 * scale, // height - scaled island collision box
        8.0 * scale, // depth - scaled island collision box
        { x: 0, y: 2.0 * scale, z: 0 }, // offset slightly up from ground
    )
    entity.addComponent(collision)

    return entity
}
