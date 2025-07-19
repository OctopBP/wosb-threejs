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

// Configuration for barrel spawning
export interface BarrelSpawnConfig {
    xpValue: number // XP value per barrel
    collectionRange: number // How close player needs to be to collect
    floatSpeed: number // Animation speed
    lifespan: number // How long barrels last (0 = infinite)
    spawnCount: number // How many barrels to spawn
    spawnRadius: number // Radius around death position to spawn barrels
}

// Default configuration for XP barrels
export const defaultBarrelConfig: BarrelSpawnConfig = {
    xpValue: 5, // Each barrel gives 5 XP (so 5 barrels = 25 XP like before)
    collectionRange: 3.0, // Player needs to be within 3 units
    floatSpeed: 2.0, // Floating animation speed
    lifespan: 30.0, // Barrels last 30 seconds before disappearing
    spawnCount: 5, // Spawn 5 barrels per enemy
    spawnRadius: 2.0, // Spread barrels within 2 units of death position
}

// Boss barrel configuration (more barrels, higher XP)
export const bossBarrelConfig: BarrelSpawnConfig = {
    xpValue: 20, // Each barrel gives 20 XP
    collectionRange: 3.0,
    floatSpeed: 2.0,
    lifespan: 60.0, // Boss barrels last longer
    spawnCount: 25, // Boss drops 25 barrels (500 XP total, same as 20x multiplier)
    spawnRadius: 4.0, // Larger spread for boss
}

export function createXPBarrel(
    x: number,
    y: number,
    z: number,
    xpValue: number,
    config: Partial<BarrelSpawnConfig> = {},
): Entity {
    const entity = new Entity()
    const currentTime = Date.now() / 1000 // Current time in seconds

    // Merge with default config
    const barrelConfig = { ...defaultBarrelConfig, ...config }

    // Position component - start at drop height, will animate down to water level
    const dropHeight = 3.0 + Math.random() * 2.0 // Random drop height between 3-5 units
    const position: PositionComponent = {
        type: 'position',
        x,
        y: dropHeight, // Start at drop height for animation
        z,
        rotationX: Math.random() * Math.PI * 2, // Random rotation for variety
        rotationY: Math.random() * Math.PI * 2,
        rotationZ: Math.random() * Math.PI * 2,
    }
    entity.addComponent(position)

    // Velocity component - slight random drift to simulate floating
    const velocity: VelocityComponent = {
        type: 'velocity',
        dx: (Math.random() - 0.5) * 0.2, // Small random drift
        dy: 0,
        dz: (Math.random() - 0.5) * 0.2,
        angularVelocityX: (Math.random() - 0.5) * 0.5,
        angularVelocityY: (Math.random() - 0.5) * 0.5,
        angularVelocityZ: (Math.random() - 0.5) * 0.5,
    }
    entity.addComponent(velocity)

    // XP Barrel component
    const xpBarrel: XPBarrelComponent = {
        type: 'xpBarrel',
        xpValue,
        collectionRange: barrelConfig.collectionRange,
        isCollected: false,
        floatHeight: 0, // No floating height, stay on water
        floatSpeed: 0, // No floating animation
        spawnTime: currentTime,
        lifespan: barrelConfig.lifespan,
        isBeingAttracted: false, // Initially not being attracted
        attractionSpeed: 8.0, // Speed at which barrel moves toward player

        // Animation properties
        animationState: 'dropping', // Start with dropping animation
        dropStartHeight: dropHeight,
        dropSpeed: 6.0, // Speed of dropping animation
        collectAnimationProgress: 0,
        collectAnimationDuration: 0.5, // Collection animation takes 0.5 seconds
    }
    entity.addComponent(xpBarrel)

    // Collectable component
    const collectable: CollectableComponent = {
        type: 'collectable',
        collectionRange: barrelConfig.collectionRange,
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
            radius: barrelConfig.collectionRange, // Collision radius matches collection range
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
    totalXP: number,
    config: BarrelSpawnConfig = defaultBarrelConfig,
): Entity[] {
    const barrels: Entity[] = []
    const xpPerBarrel = Math.ceil(totalXP / config.spawnCount)

    for (let i = 0; i < config.spawnCount; i++) {
        // Calculate random position around center within spawn radius
        const angle =
            (Math.PI * 2 * i) / config.spawnCount + Math.random() * 0.5
        const distance = Math.random() * config.spawnRadius

        const barrelX = centerX + Math.cos(angle) * distance
        const barrelZ = centerZ + Math.sin(angle) * distance

        // Create barrel with appropriate XP value
        const barrel = createXPBarrel(
            barrelX,
            centerY,
            barrelZ,
            xpPerBarrel,
            config,
        )
        barrels.push(barrel)
    }

    return barrels
}
