import {
    createIslandMeshCollision,
    createModelCollision,
} from '../config/CollisionConfig'
import type {
    CollisionComponent,
    DamageableComponent,
    HealthComponent,
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

    // Health component - islands are indestructible environment objects
    // High health ensures they don't get destroyed by projectiles but can still be hit
    const health: HealthComponent = {
        type: 'health',
        maxHealth: 99999, // Effectively indestructible
        currentHealth: 99999,
        isDead: false,
    }
    entity.addComponent(health)

    // Damageable component - allows projectiles to hit islands
    const damageable: DamageableComponent = {
        type: 'damageable',
    }
    entity.addComponent(damageable)

    // Model-based collision component using island mesh with geometry precision
    // This provides the most accurate collision detection using the actual mesh geometry
    const collision = createIslandMeshCollision(
        scale, // Use the provided scale parameter
        { x: 0, y: 0, z: 0 }, // No offset needed for islands
    )
    entity.addComponent(collision)

    return entity
}

/**
 * Create an island with custom collision precision
 * Useful for performance tuning - you can use 'boundingBox' for simpler collision
 */
export function createIslandWithPrecision(
    x: number,
    y: number,
    z: number,
    precision: 'boundingBox' | 'boundingSphere' | 'geometry' = 'geometry',
    scale: number = 1.0,
): Entity {
    const entity = createIsland(x, y, z, scale)

    // Replace the collision component with custom precision
    entity.removeComponent('collision')

    const collision = createModelCollision('island', precision, scale, {
        x: 0,
        y: 0,
        z: 0,
    })
    entity.addComponent(collision)

    return entity
}
