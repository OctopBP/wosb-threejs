import { Color, Vector3 } from 'three'

import type { ParticleSystemConfig } from '../systems/ParticleSystem'

/**
 * Configuration for gunSmoke particles that appear when weapons fire
 */
export const gunSmokeParticleConfig: ParticleSystemConfig = {
    position: new Vector3(0, 0, 0),

    emissionRate: 0,
    burstCount: 3,
    burstInterval: -1,

    life: 1,
    size: { min: 1, max: 3 },
    speed: { min: 1, max: 3 },

    spawnArea: {
        type: 'point',
        size: new Vector3(0, 0, 0),
    },

    direction: new Vector3(0, 0, 1),
    directionSpread: Math.PI * 0.2,

    gravity: new Vector3(0, 0.5, 0),
    drag: 1,

    startColor: new Color(0xffffff),
    endColor: new Color(0xffffff),

    rotation: 0,
    rotationSpeed: 0,

    // Texture
    texture: 'assets/sprites/gun_smoke.png',
    spriteSheet: {
        columns: 3,
        rows: 3,
        frameDuration: 0.1,
        randomStartFrame: false,
    },

    // Animation curves for realistic smoke behavior
    sizeOverTime: [
        { time: 0.0, value: 0 },
        { time: 0.2, value: 1 },
        { time: 1.0, value: 1.5 },
    ],
    alphaOverTime: [
        { time: 0.0, value: 0 },
        { time: 0.1, value: 1 },
        { time: 0.6, value: 1 },
        { time: 1.0, value: 0.0 },
    ],
}

/**
 * Configuration for wreckage particles that appear when on hit
 */
export const wreckageParticleConfig: ParticleSystemConfig = {
    position: new Vector3(0, 0, 0),

    emissionRate: 0,
    burstCount: 4,
    burstInterval: -1,

    // Particle properties
    life: 0.75,
    size: { min: 0.75, max: 1.0 },
    speed: { min: 3.0, max: 4.0 },

    spawnArea: {
        type: 'point',
        size: new Vector3(0, 0, 0),
    },

    direction: new Vector3(0, 0, 0),
    directionSpread: Math.PI * 0.2,

    gravity: new Vector3(0, -1, 0),
    drag: 1,

    startColor: new Color(0xffffff),
    endColor: new Color(0xffffff),

    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -2, max: 2 },

    // Texture
    texture: 'assets/sprites/wreckage.png',
    spriteSheet: {
        columns: 2,
        rows: 2,
        frameDuration: 0,
        randomStartFrame: true,
    },

    alphaOverTime: [
        { time: 0.0, value: 1 },
        { time: 0.5, value: 1 },
        { time: 1.0, value: 0 },
    ],
}

/**
 * Configuration for dramatic wreckage particles that appear when ships are destroyed
 */
export const deathWreckageParticleConfig: ParticleSystemConfig = {
    position: new Vector3(0, 0, 0),

    emissionRate: 0,
    burstCount: 8,
    burstInterval: -1,

    // Particle properties
    life: { min: 1.5, max: 2.5 },
    size: { min: 1.0, max: 1.5 },
    speed: { min: 2.0, max: 6.0 },

    spawnArea: {
        type: 'sphere',
        size: new Vector3(1, 0.5, 1), // Spread particles around ship
    },

    direction: new Vector3(0, 1, 0),
    directionSpread: Math.PI, // Full hemisphere spread

    gravity: new Vector3(0, -2, 0), // Stronger gravity for dramatic effect
    drag: 0.5, // Less drag so particles travel further

    startColor: new Color(0xffffff),
    endColor: new Color(0xffffff),

    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -3, max: 3 }, // Faster rotation for more drama

    // Texture
    texture: 'assets/sprites/wreckage.png',
    spriteSheet: {
        columns: 2,
        rows: 2,
        frameDuration: 0,
        randomStartFrame: true,
    },

    alphaOverTime: [
        { time: 0.0, value: 1 },
        { time: 0.7, value: 1 },
        { time: 1.0, value: 0 },
    ],
}

/**
 * All particle configurations for easy access
 */
export const particleConfigs = {
    gunSmoke: gunSmokeParticleConfig,
    wreckage: wreckageParticleConfig,
    deathWreckage: deathWreckageParticleConfig,
} as const

/**
 * Get a particle config by name with position override
 * Returns a deep copy to avoid modifying the original config
 */
export function getParticleConfig(
    name: keyof typeof particleConfigs,
    position: Vector3,
    direction?: Vector3,
): ParticleSystemConfig {
    const original = particleConfigs[name]

    // Create a deep copy of the config
    const baseConfig: ParticleSystemConfig = {
        ...original,
        position: position.clone(),
        direction: original.direction.clone(),
        gravity: original.gravity.clone(),
        startColor: original.startColor.clone(),
        endColor: original.endColor.clone(),
        spawnArea: {
            ...original.spawnArea,
            size: original.spawnArea.size.clone(),
        },
        // Deep copy animation curves if they exist
        sizeOverTime: original.sizeOverTime
            ? [...original.sizeOverTime]
            : undefined,
        alphaOverTime: original.alphaOverTime
            ? [...original.alphaOverTime]
            : undefined,
        colorOverTime: original.colorOverTime
            ? original.colorOverTime.map((point) => ({
                  time: point.time,
                  value: point.value.clone(),
              }))
            : undefined,
        // Copy sprite sheet config if it exists
        spriteSheet: original.spriteSheet
            ? { ...original.spriteSheet }
            : undefined,
    }

    // Override direction if provided (useful for directional effects like gunSmoke)
    if (direction) {
        baseConfig.direction = direction.clone().normalize()
    }

    return baseConfig
}
