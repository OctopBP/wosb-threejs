import {
    bossMovementPreset,
    createBossAIConfig,
    createBossHealthConfig,
    createBossWeaponConfig,
    getBossVisualConfig,
} from '../config/BossConfig'
import {
    createBossShipCollision,
    createEnemyShipCollision,
} from '../config/CollisionConfig'
import {
    createEnemyAIConfig,
    createEnemyHealthConfig,
    createEnemyWeaponConfig,
    enemyMovementPreset,
} from '../config/EnemyConfig'
import { createMovementConfig } from '../config/MovementPresets'
import type {
    AliveComponent,
    BossComponent,
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

    // Collision component - box collider for enemy ship
    const collision = createEnemyShipCollision({ x: 0, y: 0.5, z: 0 })
    entity.addComponent(collision)

    // Renderable component - use ship model (different from player if available)
    const renderable: RenderableComponent = {
        type: 'renderable',
        meshId: `enemy_ship_${entity.id}`,
        mesh: undefined, // Will be created by RenderSystem
        meshType: 'enemy1',
        visible: true,
        upgrades: {},
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

    // Alive component - enemy starts alive
    const alive: AliveComponent = {
        type: 'alive',
    }
    entity.addComponent(alive)

    return entity
}

// Create a powerful boss ship
export function createBossShip(
    x: number,
    y: number,
    z: number,
    targetId: number | null = null,
): Entity {
    const entity = new Entity()

    // Get boss configuration
    const bossVisualConfig = getBossVisualConfig()

    // Position component - spawn at specified location
    const position: PositionComponent = {
        type: 'position',
        x,
        y,
        z,
        rotationX: 0,
        rotationY: Math.PI, // Face towards player
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

    // Movement configuration - use boss preset
    const bossMovementConfig = createMovementConfig(bossMovementPreset)
    entity.addComponent(bossMovementConfig)

    // Health component - use boss health config
    const health = createBossHealthConfig()
    entity.addComponent(health)

    // Weapon component - use boss weapon config
    const weapon = createBossWeaponConfig()
    entity.addComponent(weapon)

    // Damageable component - boss can take damage
    const damageable: DamageableComponent = {
        type: 'damageable',
    }
    entity.addComponent(damageable)

    // Collision component - box collider for boss ship (larger than regular enemies)
    const collision = createBossShipCollision({ x: 0, y: 1, z: 0 })
    entity.addComponent(collision)

    // Renderable component - use boss visual config
    const renderable: RenderableComponent = {
        type: 'renderable',
        meshId: `boss_ship_${entity.id}`,
        mesh: undefined, // Will be created by RenderSystem
        meshType: bossVisualConfig.meshType,
        visible: true,
        upgrades: {},
    }
    entity.addComponent(renderable)

    // Enemy tag component (boss is still an enemy type)
    const enemy: EnemyComponent = {
        type: 'enemy',
    }
    entity.addComponent(enemy)

    // Boss tag component with scale information
    const boss: BossComponent = {
        type: 'boss',
        bossType: 'basic',
        damagePerShot: weapon.damage,
    }
    entity.addComponent(boss)

    // Enemy AI component - use boss AI config
    const enemyAI = createBossAIConfig(targetId)
    entity.addComponent(enemyAI)

    // Alive component - boss starts alive
    const alive: AliveComponent = {
        type: 'alive',
    }
    entity.addComponent(alive)

    return entity
}
