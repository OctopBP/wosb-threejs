import type { PositionComponent, RenderableComponent } from '../ecs/Component'
import { Entity } from '../ecs/Entity'

export function createIsland(
    x: number,
    y: number,
    z: number,
    _scale: number = 1.0,
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

    return entity
}
