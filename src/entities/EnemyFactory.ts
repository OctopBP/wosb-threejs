import { createMovementConfig } from '../config/MovementPresets'
import { createWeaponConfig } from '../config/WeaponConfig'
import type {
    DamageableComponent,
    EnemyAIComponent,
    EnemyComponent,
    HealthComponent,
    MovementConfigComponent,
    PositionComponent,
    RenderableComponent,
    VelocityComponent,
    WeaponComponent,
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

    // Movement configuration - enemies move slower than player
    const movementConfig = createMovementConfig({
        maxSpeed: 2.0, // Slower than player
        accelerationForce: 4.0, // Slower acceleration
        boundaries: {
            minX: -15,
            maxX: 15,
            minY: 0,
            maxY: 5,
            minZ: -15,
            maxZ: 15,
        },
    })
    entity.addComponent(movementConfig)

    // Health component - enemies have 50 HP as specified
    const health: HealthComponent = {
        type: 'health',
        maxHealth: 50,
        currentHealth: 50,
        isDead: false,
    }
    entity.addComponent(health)

    // Weapon component - weak weapon as specified
    const weapon = createWeaponConfig({
        damage: 15, // Weaker than player (player has 25)
        fireRate: 0.5, // Slower fire rate than player
        projectileSpeed: 8.0, // Slower projectiles
        range: 12.0, // Shorter range
    })
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
        meshType: 'ship', // Use same ship model for now
        visible: true,
    }
    entity.addComponent(renderable)

    // Enemy tag component
    const enemy: EnemyComponent = {
        type: 'enemy',
    }
    entity.addComponent(enemy)

    // Enemy AI component
    const enemyAI: EnemyAIComponent = {
        type: 'enemyAI',
        moveSpeed: 2.0,
        shootingRange: 12.0,
        lastShotTime: 0,
        targetId: targetId,
        movementDirection: {
            x: 0,
            z: -1, // Move towards player initially (negative Z)
        },
    }
    entity.addComponent(enemyAI)

    return entity
}
