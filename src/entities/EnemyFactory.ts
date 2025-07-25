import { Vector2 } from 'three'
import {
    bossMovementPreset,
    createBossHealthConfig,
    createBossWeaponConfig,
    getBossVisualConfig,
} from '../config/BossConfig'
import {
    createBossShipCollision,
    createEnemyShipCollision,
} from '../config/CollisionConfig'
import {
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
    InputComponent,
    PositionComponent,
    RenderableComponent,
    RotationSpeedComponent,
    SpeedComponent,
} from '../ecs/Component'
import { Entity } from '../ecs/Entity'

export function createEnemyShip(
    x: number,
    z: number,
    playerX: number,
    playerZ: number,
): Entity {
    const entity = new Entity()

    // Calculate angle to player
    const dx = x - playerX
    const dz = z - playerZ
    const angleToPlayer = Math.atan2(dx, dz)

    // Position component - spawn at specified location
    const position: PositionComponent = {
        type: 'position',
        x,
        y: -0.1,
        z,
        rotationX: 0,
        rotationY: angleToPlayer,
        rotationZ: 0,
    }
    entity.addComponent(position)

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

    entity.addComponent<SpeedComponent>({
        type: 'speed',
        currentSpeed: 0,
        maxSpeed: movementConfig.maxSpeed,
    })

    entity.addComponent<RotationSpeedComponent>({
        type: 'rotationSpeed',
        currentRotationSpeed: 0,
        maxRotationSpeed: movementConfig.maxRotationSpeed,
    })

    entity.addComponent<InputComponent>({
        type: 'input',
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false,
        pointerX: 0,
        pointerY: 0,
        direction: new Vector2(),
        hasInput: false,
        isPointerDown: false,
    })

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
    z: number,
    playerX: number,
    playerZ: number,
): Entity {
    const entity = new Entity()

    // Get boss configuration
    const bossVisualConfig = getBossVisualConfig()

    // Calculate angle to player
    const dx = x - playerX
    const dz = z - playerZ
    const angleToPlayer = Math.atan2(dx, dz)

    // Position component - spawn at specified location
    const position: PositionComponent = {
        type: 'position',
        x,
        y: -0.1,
        z,
        rotationX: 0,
        rotationY: angleToPlayer,
        rotationZ: 0,
    }
    entity.addComponent(position)

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

    entity.addComponent<SpeedComponent>({
        type: 'speed',
        currentSpeed: 0,
        maxSpeed: bossMovementConfig.maxSpeed,
    })

    entity.addComponent<RotationSpeedComponent>({
        type: 'rotationSpeed',
        currentRotationSpeed: 0,
        maxRotationSpeed: bossMovementConfig.maxRotationSpeed,
    })

    entity.addComponent<InputComponent>({
        type: 'input',
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false,
        pointerX: 0,
        pointerY: 0,
        direction: new Vector2(),
        hasInput: false,
        isPointerDown: false,
    })

    // Alive component - boss starts alive
    const alive: AliveComponent = {
        type: 'alive',
    }
    entity.addComponent(alive)

    return entity
}
