import {
    createLevelComponent,
    createLevelingStatsComponent,
    createXPComponent,
} from '../config/LevelingConfig'
import type { MovementConfigPreset } from '../config/MovementPresets'
import { createMovementConfig } from '../config/MovementPresets'
import {
    createAutoTargetingWeaponConfig,
    createWeaponConfig,
} from '../config/WeaponConfig'
import type {
    CollisionComponent,
    DamageableComponent,
    HealthComponent,
    InputComponent,
    MovementConfigComponent,
    PlayerComponent,
    PositionComponent,
    RenderableComponent,
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
        y: 0.1, // Slightly above the ground
        z: 0,
        rotationX: 0,
        rotationY: Math.PI, // Face forward (compensate for model facing backwards by default)
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

    // Input component - no initial input with direction output
    const input: InputComponent = {
        type: 'input',
        // Raw input state
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        pointerX: 0,
        pointerY: 0,
        isTouching: false,
        isPointerDown: false,
        // Processed direction output
        direction: {
            x: 0, // left/right direction
            y: 0, // forward/backward direction
        },
        hasInput: false,
    }
    entity.addComponent(input)

    // Movement configuration using balanced preset
    const movementConfig = createMovementConfig(configOverrides)
    entity.addComponent(movementConfig)

    // Health component - player starts with full health
    const health: HealthComponent = {
        type: 'health',
        maxHealth: 100,
        currentHealth: 100,
        isDead: false,
    }
    entity.addComponent(health)

    // Weapon component - player has a basic cannon
    const weapon = createWeaponConfig()
    entity.addComponent(weapon)

    // Damageable component - player can take damage
    const damageable: DamageableComponent = {
        type: 'damageable',
    }
    entity.addComponent(damageable)

    // Renderable component - use ship GLTF model
    const renderable: RenderableComponent = {
        type: 'renderable',
        meshId: `player_ship_${entity.id}`,
        mesh: undefined, // Will be created by RenderSystem
        meshType: 'ship',
        visible: true,
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

    // Collision component for ship-to-ship physics
    const collision: CollisionComponent = {
        type: 'collision',
        radius: 1.2, // Player ships are slightly larger
        mass: 100, // Heavy ship for stability
        restitution: 0.3, // Some bounce but not too much
        isStatic: false, // Player can be pushed by collisions
    }
    entity.addComponent(collision)

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

// New function to equip player with auto-targeting weapon
export function equipAutoTargetingWeapon(
    entity: Entity,
    overrides: Partial<Omit<WeaponComponent, 'type' | 'lastShotTime'>> = {},
): void {
    const newWeapon = createAutoTargetingWeaponConfig(overrides)

    // Remove existing weapon and add new one
    entity.removeComponent('weapon')
    entity.addComponent(newWeapon)
}

// New function to equip player with manual weapon
export function equipManualWeapon(
    entity: Entity,
    overrides: Partial<Omit<WeaponComponent, 'type' | 'lastShotTime'>> = {},
): void {
    const newWeapon = createWeaponConfig(overrides)

    // Remove existing weapon and add new one
    entity.removeComponent('weapon')
    entity.addComponent(newWeapon)
}

// Helper function to check if player has auto-targeting weapon
export function hasAutoTargetingWeapon(entity: Entity): boolean {
    const weapon = entity.getComponent<WeaponComponent>('weapon')
    return weapon?.isAutoTargeting ?? false
}
