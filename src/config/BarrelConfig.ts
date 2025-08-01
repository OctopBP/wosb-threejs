// Configuration for barrel spawning and behavior
export interface BarrelConfig {
    // XP and spawning
    xpPerBarrel: number // XP value per barrel
    regularEnemyBarrelCount: number // How many barrels regular enemies drop
    bossBarrelCount: number // How many barrels bosses drop

    // Collection behavior
    collectionRange: number // Distance within which player can collect
    attractionSpeed: number // Speed at which barrel moves toward player

    // Spawning and scattering
    spawnRadius: number // Radius around death position to scatter barrels

    // Flight animation
    flightTimeMin: number // Minimum flight time in seconds
    flightTimeMax: number // Maximum flight time in seconds
    arcHeightMin: number // Minimum arc height
    arcHeightMax: number // Maximum arc height

    // Spinning during flight
    spinSpeedX: number // Rotation speed on X axis during flight
    spinSpeedY: number // Rotation speed on Y axis during flight
    spinSpeedZ: number // Rotation speed on Z axis during flight

    // Floating behavior
    driftSpeedMin: number // Minimum drift velocity
    driftSpeedMax: number // Maximum drift velocity

    // Lifespan
    regularBarrelLifespan: number // How long regular barrels last (seconds)
    bossBarrelLifespan: number // How long boss barrels last (seconds)
}

// Default barrel configuration
export const defaultBarrelConfig: BarrelConfig = {
    // XP and spawning
    xpPerBarrel: 10,
    regularEnemyBarrelCount: 3,
    bossBarrelCount: 25,

    // Collection behavior
    collectionRange: 3.0,
    attractionSpeed: 20.0,

    // Spawning and scattering
    spawnRadius: 2.0,

    // Flight animation
    flightTimeMin: 1.0,
    flightTimeMax: 1.5,
    arcHeightMin: 2.0,
    arcHeightMax: 4.0,

    // Spinning during flight
    spinSpeedX: 3.0,
    spinSpeedY: 2.0,
    spinSpeedZ: 4.0,

    // Floating behavior
    driftSpeedMin: 0.1,
    driftSpeedMax: 0.2,

    // Lifespan
    regularBarrelLifespan: 30.0,
    bossBarrelLifespan: 60.0,
}

// Boss-specific barrel configuration
export const bossBarrelConfig: BarrelConfig = {
    ...defaultBarrelConfig,
    // Override boss-specific values
    xpPerBarrel: 20,
    spawnRadius: 4.0,
}
