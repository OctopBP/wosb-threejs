import { Color, Vector3 } from 'three'

import type { ParticleSystemConfig } from '../systems/ParticleSystem'

/**
 * Configuration for gunSmoke particles that appear when weapons fire
 */
export const gunSmokeParticleConfig: ParticleSystemConfig = {
    id: 'gunSmoke',
    position: new Vector3(0, 0, 0),

    emissionRate: 0,
    burstCount: 1,
    burstInterval: -1,

    // Particle properties
    life: 0.9,
    size: { min: 1.25, max: 1.75 },
    speed: { min: 2.0, max: 3.0 },

    spawnArea: {
        type: 'point',
        size: new Vector3(0, 0, 0),
    },

    direction: new Vector3(0, 0, 1),
    directionSpread: Math.PI * 0.15,

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
    id: 'wreckage',
    position: new Vector3(0, 0, 0),

    emissionRate: 0,
    burstCount: 3,
    burstInterval: -1,

    // Particle properties
    life: 1.5,
    size: { min: 1.25, max: 1.75 },
    speed: { min: 2.0, max: 3.0 },

    spawnArea: {
        type: 'point',
        size: new Vector3(0, 0, 0),
    },

    direction: new Vector3(0, 0, 1),
    directionSpread: Math.PI * 0.15,

    gravity: new Vector3(0, 0.5, 0),
    drag: 1,

    startColor: new Color(0xffffff),
    endColor: new Color(0xffffff),

    rotation: { min: 0, max: Math.PI * 1 },
    rotationSpeed: { min: -2, max: 2 },

    // Texture
    texture: 'assets/sprites/wreckage.png',
    spriteSheet: {
        columns: 2,
        rows: 2,
        frameDuration: 10,
        randomStartFrame: true,
    },

    alphaOverTime: [
        { time: 0.0, value: 0 },
        { time: 0.1, value: 1 },
        { time: 1.0, value: 0.0 },
    ],
}

/**
 * All particle configurations for easy access
 */
export const particleConfigs = {
    gunSmoke: gunSmokeParticleConfig,
} as const

/**
 * Get a particle config by name with position override
 */
export function getParticleConfig(
    name: keyof typeof particleConfigs,
    position: Vector3,
    direction?: Vector3,
): ParticleSystemConfig {
    const baseConfig = { ...particleConfigs[name] }
    baseConfig.position = position.clone()

    // Override direction if provided (useful for directional effects like gunSmoke)
    if (direction) {
        baseConfig.direction = direction.clone().normalize()
    }

    return baseConfig
}
