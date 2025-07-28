import { Vector2 } from 'three'
import { createPlayerShipCollision } from '../config/CollisionConfig'
import {
    createLevelComponent,
    createLevelingStatsComponent,
    createXPComponent,
} from '../config/LevelingConfig'
import type { MovementConfigPreset } from '../config/MovementPresets'
import { createMovementConfig } from '../config/MovementPresets'
import { createPlayerWeaponConfig } from '../config/WeaponConfig'
import type {
    AliveComponent,
    DamageableComponent,
    FoamTrailComponent,
    HealthComponent,
    InputComponent,
    MovementConfigComponent,
    PlayerComponent,
    PositionComponent,
    RenderableComponent,
    RotationSpeedComponent,
    SpeedComponent,
    VelocityComponent,
    WeaponComponent,
} from '../ecs/Component'
import { Entity } from '../ecs/Entity'
export function createPlayerShip(
    configOverrides: Partial<MovementConfigPreset> = {},
): Entity {
    const entity = new Entity()

    // Position component - start at origin
    const position: PositionComponent = {
        type: 'position',
        x: 0,
        y: -0.1,
        z: 0,
        rotationX: 0,
        rotationY: Math.PI, // Face forward (compensate for model facing backwards by default)
        rotationZ: 0,
    }
    entity.addComponent(position)

    // Speed component - no initial movement
    const speed: SpeedComponent = {
        type: 'speed',
        currentSpeed: 0,
        maxSpeed: 2.5, // Will be overridden by movement config, but good default
    }
    entity.addComponent(speed)

    // Velocity component - for physics integration
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

    // Rotation speed component - no initial rotation
    const rotationSpeed: RotationSpeedComponent = {
        type: 'rotationSpeed',
        currentRotationSpeed: 0,
        maxRotationSpeed: 4.0, // Will be overridden by movement config, but good default
    }
    entity.addComponent(rotationSpeed)

    entity.addComponent<FoamTrailComponent>({
        type: 'foamTrail',
        size: 0.004,
    })

    // Input component - no initial input with direction output
    const input: InputComponent = {
        type: 'input',
        // Raw input state
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false,
        pointerX: 0,
        pointerY: 0,
        isPointerDown: false,
        // Processed direction output
        direction: new Vector2(),
        hasInput: false,
    }
    entity.addComponent(input)

    // Movement configuration using balanced preset
    const movementConfig = createMovementConfig(configOverrides)
    entity.addComponent(movementConfig)

    // Health component - player starts with full health
    const health: HealthComponent = {
        type: 'health',
        maxHealth: 60, // Matches the new base health from leveling config
        currentHealth: 60,
        isDead: false,
    }
    entity.addComponent(health)

    // Weapon component - player has auto-targeting weapon
    const weapon = createPlayerWeaponConfig()
    entity.addComponent(weapon)

    // Damageable component - player can take damage
    const damageable: DamageableComponent = {
        type: 'damageable',
    }
    entity.addComponent(damageable)

    // Collision component - box collider for ship
    const collision = createPlayerShipCollision({ x: 0, y: 0.5, z: 0 })
    entity.addComponent(collision)

    // Renderable component - use ship GLTF model
    const renderable: RenderableComponent = {
        type: 'renderable',
        meshId: `player_ship_${entity.id}`,
        mesh: undefined, // Will be created by RenderSystem
        meshType: 'ship_lvl_1',
        visible: true,
        upgrades: {},
    }
    entity.addComponent(renderable)

    // Player tag component
    const player: PlayerComponent = {
        type: 'player',
    }
    entity.addComponent(player)

    // XP component for tracking experience points
    const xp = createXPComponent()
    entity.addComponent(xp)

    // Level component for tracking player level
    const level = createLevelComponent()
    entity.addComponent(level)

    // Leveling stats component for stat improvements
    const levelingStats = createLevelingStatsComponent()
    entity.addComponent(levelingStats)

    // Alive component - player starts alive
    const alive: AliveComponent = {
        type: 'alive',
    }
    entity.addComponent(alive)

    return entity
}

export function updateMovementConfig(
    entity: Entity,
    overrides: Partial<Omit<MovementConfigComponent, 'type'>>,
): void {
    const config =
        entity.getComponent<MovementConfigComponent>('movementConfig')
    if (config) {
        Object.assign(config, overrides)
    }
}

export function updateWeaponConfig(
    entity: Entity,
    overrides: Partial<Omit<WeaponComponent, 'type' | 'lastShotTime'>>,
): void {
    const weapon = entity.getComponent<WeaponComponent>('weapon')
    if (weapon) {
        Object.assign(weapon, overrides)
    }
}

// Function to equip player with weapon (auto-targeting only)
export function equipPlayerWeapon(
    entity: Entity,
    overrides: Partial<Omit<WeaponComponent, 'type' | 'lastShotTime'>> = {},
): void {
    const newWeapon = createPlayerWeaponConfig(overrides)

    // Remove existing weapon and add new one
    entity.removeComponent('weapon')
    entity.addComponent(newWeapon)
}
