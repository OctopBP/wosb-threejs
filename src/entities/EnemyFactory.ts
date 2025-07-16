import {
    createEnemyAIConfig,
    createEnemyHealthConfig,
    createEnemyWeaponConfig,
    enemyMovementPreset,
} from '../config/EnemyConfig'
import { createMovementConfig } from '../config/MovementPresets'
import type {
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

// Create a powerful boss ship
export function createBossShip(
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

    // Movement configuration - slower but more aggressive than regular enemies
    const bossMovementConfig = createMovementConfig({
        ...enemyMovementPreset,
        maxSpeed: 5.0, // Slower than regular enemies
        accelerationForce: 4.0,
    })
    entity.addComponent(bossMovementConfig)

    // Health component - much more health than regular enemies
    const health = createEnemyHealthConfig()
    health.maxHealth = 50 // Much stronger than regular enemies
    health.currentHealth = health.maxHealth
    entity.addComponent(health)

    // Weapon component - more powerful weapon
    const weapon = createEnemyWeaponConfig()
    weapon.damage = 34 // High damage to kill player in 3 hits (assuming player has 100 health)
    weapon.fireRate = 0.8 // Slower fire rate than regular enemies
    weapon.range = 12 // Longer range
    weapon.detectionRange = 15
    entity.addComponent(weapon)

    // Damageable component - boss can take damage
    const damageable: DamageableComponent = {
        type: 'damageable',
    }
    entity.addComponent(damageable)

    // Renderable component - use boss model (larger/different from regular enemies)
    const renderable: RenderableComponent = {
        type: 'renderable',
        meshId: `boss_ship_${entity.id}`,
        mesh: undefined, // Will be created by RenderSystem
        meshType: 'enemy1', // For now use enemy model, can be changed to 'boss' later
        visible: true,
    }
    entity.addComponent(renderable)

    // Enemy tag component (boss is still an enemy type)
    const enemy: EnemyComponent = {
        type: 'enemy',
    }
    entity.addComponent(enemy)

    // Boss tag component
    const boss: BossComponent = {
        type: 'boss',
        bossType: 'basic',
        damagePerShot: 34, // Should kill player in 3 hits
    }
    entity.addComponent(boss)

    // Enemy AI component - more aggressive AI
    const enemyAI = createEnemyAIConfig(targetId)
    enemyAI.moveSpeed = 4.0 // Slower movement
    enemyAI.shootingRange = 12 // Longer shooting range
    entity.addComponent(enemyAI)

    return entity
}
