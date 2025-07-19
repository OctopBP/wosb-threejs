import type { BarrelConfig } from '../config/BarrelConfig'
import { bossBarrelConfig, defaultBarrelConfig } from '../config/BarrelConfig'
import type {
    BarrelAnimationState,
    CollectableComponent,
    CollisionComponent,
    PositionComponent,
    RenderableComponent,
    VelocityComponent,
    XPBarrelComponent,
} from '../ecs/Component'
import { Entity } from '../ecs/Entity'

export function createXPBarrel(
    x: number,
    y: number,
    z: number,
    config: BarrelConfig = defaultBarrelConfig,
): Entity {
    const entity = new Entity()
    const currentTime = Date.now() / 1000 // Current time in seconds

    // Position component - start at enemy position, will fly to target
    const position: PositionComponent = {
        type: 'position',
        x, // Start at enemy position
        y,
        z,
        rotationX: Math.random() * Math.PI * 2, // Random rotation for variety
        rotationY: Math.random() * Math.PI * 2,
        rotationZ: Math.random() * Math.PI * 2,
    }
    entity.addComponent(position)

    // Velocity component - starts at zero, will be set during animation
    const velocity: VelocityComponent = {
        type: 'velocity',
        dx: 0, // Will be set during flight animation
        dy: 0,
        dz: 0,
        angularVelocityX: 0,
        angularVelocityY: 0,
        angularVelocityZ: 0,
    }
    entity.addComponent(velocity)

    // Calculate random target position around the enemy
    const angle = Math.random() * Math.PI * 2 // Random direction
    const distance = Math.random() * config.spawnRadius // Random distance within radius
    const targetX = x + Math.cos(angle) * distance
    const targetZ = z + Math.sin(angle) * distance

    // XP Barrel component
    const xpBarrel: XPBarrelComponent = {
        type: 'xpBarrel',
        xpValue: config.xpPerBarrel,
        collectionRange: config.collectionRange,
        isCollected: false,
        spawnTime: currentTime,
        lifespan: config.regularBarrelLifespan,
        isBeingAttracted: false, // Initially not being attracted
        attractionSpeed: config.attractionSpeed,

        // Explosion/Arc animation properties
        animationState: 'flying', // Start with flying animation
        startPosition: { x, y, z }, // Enemy position
        targetPosition: { x: targetX, y: 0, z: targetZ }, // Random position around enemy
        flightTime:
            config.flightTimeMin +
            Math.random() * (config.flightTimeMax - config.flightTimeMin),
        flightProgress: 0, // Start at beginning of flight
        arcHeight:
            config.arcHeightMin +
            Math.random() * (config.arcHeightMax - config.arcHeightMin),
    }
    entity.addComponent(xpBarrel)

    // Collectable component
    const collectable: CollectableComponent = {
        type: 'collectable',
        collectionRange: config.collectionRange,
        autoCollect: true, // Automatically collect when in range
        requiresInput: false, // No input required
        collectedBy: [],
    }
    entity.addComponent(collectable)

    // Collision component - small sphere collider for collection detection
    const collision: CollisionComponent = {
        type: 'collision',
        collider: {
            shape: 'sphere',
            radius: config.collectionRange, // Collision radius matches collection range
        },
        offset: { x: 0, y: 0.5, z: 0 }, // Slightly above water
    }
    entity.addComponent(collision)

    // Renderable component - use barrel model
    const renderable: RenderableComponent = {
        type: 'renderable',
        meshId: `xp_barrel_${entity.id}`,
        mesh: undefined, // Will be created by RenderSystem
        meshType: 'barrel', // This should map to barrel.glb in ModelConfig
        visible: true,
        upgrades: {},
    }
    entity.addComponent(renderable)

    return entity
}

// Utility function to spawn multiple barrels around a position
export function spawnBarrelsAroundPosition(
    centerX: number,
    centerY: number,
    centerZ: number,
    isBoss: boolean = false,
): Entity[] {
    const barrels: Entity[] = []
    const config = isBoss ? bossBarrelConfig : defaultBarrelConfig
    const barrelCount = isBoss
        ? config.bossBarrelCount
        : config.regularEnemyBarrelCount

    for (let i = 0; i < barrelCount; i++) {
        // Create barrel at enemy position - it will scatter during flight animation
        const barrel = createXPBarrel(centerX, centerY, centerZ, config)
        barrels.push(barrel)
    }

    return barrels
}
