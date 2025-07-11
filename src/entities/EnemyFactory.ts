import {
    createEnemyAIConfig,
    createEnemyHealthConfig,
    createEnemyWeaponConfig,
    enemyMovementPreset,
} from '../config/EnemyConfig'
import { createMovementConfig } from '../config/MovementPresets'
import type {
    DamageableComponent,
    EnemyComponent,
    PositionComponent,
    RenderableComponent,
    VelocityComponent,
} from '../ecs/Component'
import { Entity } from '../ecs/Entity'
export function createEnemyShip(
    x: number,
    y: number,
    z: number,
    targetId: number | null = null,
): Entity {
    const entity = new Entity()

    // Position component - spawn at specified location
    const position: PositionComponent = {
        type: 'position',
        x,
        y,
        z,
        rotationX: 0,
        rotationY: Math.PI, // Face towards player (opposite direction)
        rotationZ: 0,
    }
    entity.addComponent(position)

    // Velocity component - no initial movement
    const velocity: VelocityComponent = {
        type: 'velocity',
        dx: 0,
        dy: 0,
        dz: 0,
        angularVelocityX: 0,
        angularVelocityY: 0,
        angularVelocityZ: 0,
    }
    entity.addComponent(velocity)

    // Movement configuration - use enemy preset
    const movementConfig = createMovementConfig(enemyMovementPreset)
    entity.addComponent(movementConfig)

    // Health component - use enemy health config
    const health = createEnemyHealthConfig()
    entity.addComponent(health)

    // Weapon component - use enemy weapon config
    const weapon = createEnemyWeaponConfig()
    entity.addComponent(weapon)

    // Damageable component - enemy can take damage
    const damageable: DamageableComponent = {
        type: 'damageable',
    }
    entity.addComponent(damageable)

    // Renderable component - use ship model (different from player if available)
    const renderable: RenderableComponent = {
        type: 'renderable',
        meshId: `enemy_ship_${entity.id}`,
        mesh: undefined, // Will be created by RenderSystem
        meshType: 'enemy1',
        visible: true,
    }
    entity.addComponent(renderable)

    // Enemy tag component
    const enemy: EnemyComponent = {
        type: 'enemy',
    }
    entity.addComponent(enemy)

    // Enemy AI component - use enemy AI config
    const enemyAI = createEnemyAIConfig(targetId)
    entity.addComponent(enemyAI)

    return entity
}
