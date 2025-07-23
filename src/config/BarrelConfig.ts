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
    xpPerBarrel: 5, // Each barrel gives 5 XP (5 barrels = 25 XP total for regular enemy)
    regularEnemyBarrelCount: 5, // Regular enemies drop 5 barrels
    bossBarrelCount: 25, // Bosses drop 25 barrels (maintains 20x multiplier: 500 XP total)

    // Collection behavior
    collectionRange: 3.0, // Player needs to be within 3 units to start attraction
    attractionSpeed: 20.0, // Barrels move toward player at 8 units/second

    // Spawning and scattering
    spawnRadius: 2.0, // Scatter barrels within 2 units of death position

    // Flight animation
    flightTimeMin: 1.0, // Minimum 1 second flight time
    flightTimeMax: 1.5, // Maximum 1.5 seconds flight time
    arcHeightMin: 2.0, // Minimum 2 units arc height
    arcHeightMax: 4.0, // Maximum 4 units arc height

    // Spinning during flight
    spinSpeedX: 3.0, // Rotation speed on X axis during flight
    spinSpeedY: 2.0, // Rotation speed on Y axis during flight
    spinSpeedZ: 4.0, // Rotation speed on Z axis during flight

    // Floating behavior
    driftSpeedMin: 0.1, // Minimum drift velocity
    driftSpeedMax: 0.2, // Maximum drift velocity

    // Lifespan
    regularBarrelLifespan: 30.0, // Regular barrels last 30 seconds
    bossBarrelLifespan: 60.0, // Boss barrels last 60 seconds
}

// Boss-specific barrel configuration
export const bossBarrelConfig: BarrelConfig = {
    ...defaultBarrelConfig,
    // Override boss-specific values
    xpPerBarrel: 20, // Boss barrels give 20 XP each
    spawnRadius: 4.0, // Larger spread for boss barrels
}
