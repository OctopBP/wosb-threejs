import type {
    DamageableComponent,
    HealthComponent,
    PositionComponent,
    RenderableComponent,
} from '../ecs/Component'
import { Entity } from '../ecs/Entity'

export function createTestObstacle(x: number, y: number, z: number): Entity {
    const entity = new Entity()

    // Position component
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

    // Health component - obstacle has health and can be destroyed
    const health: HealthComponent = {
        type: 'health',
        maxHealth: 50,
        currentHealth: 50,
        isDead: false,
    }
    entity.addComponent(health)

    // Damageable component - obstacle can take damage
    const damageable: DamageableComponent = {
        type: 'damageable',
    }
    entity.addComponent(damageable)

    // Renderable component - use box primitive for obstacle
    const renderable: RenderableComponent = {
        type: 'renderable',
        meshId: `test_obstacle_${entity.id}`,
        mesh: undefined, // Will be created by RenderSystem
        meshType: 'box', // Use box primitive instead of ship model
        visible: true,
    }
    entity.addComponent(renderable)

    return entity
}
