import { createIslandCollision } from '../config/CollisionConfig'
import { ISLAND_DATA, type IslandData } from '../config/IslandConfig'
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

// Create individual island with collision
export function createIndividualIsland(islandData: IslandData): Entity {
    const entity = new Entity()

    // Position component
    const position: PositionComponent = {
        type: 'position',
        x: islandData.position.x,
        y: islandData.position.y,
        z: islandData.position.z,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
    }
    entity.addComponent(position)

    // Collision component - sphere collider based on island size
    const collision = createIslandCollision(islandData.collisionRadius)
    entity.addComponent(collision)

    // Note: No renderable component - the main island entity handles all visuals
    // These are invisible collision-only entities

    return entity
}

// Create all island collision entities
export function createAllIslandColliders(): Entity[] {
    return ISLAND_DATA.map((islandData) => createIndividualIsland(islandData))
}
