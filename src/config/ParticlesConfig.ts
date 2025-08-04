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
 * Configuration for big explosion flames - the main blast
 */
export const bigExplosionParticleConfig: ParticleSystemConfig = {
    position: new Vector3(0, 0, 0),

    emissionRate: 0,
    burstCount: 12,
    burstInterval: -1,

    life: { min: 0.8, max: 1.2 },
    size: { min: 3.0, max: 5.0 },
    speed: { min: 4.0, max: 8.0 },

    spawnArea: {
        type: 'sphere',
        size: new Vector3(0.5, 0.3, 0.5),
    },

    direction: new Vector3(0, 1, 0),
    directionSpread: Math.PI * 0.8,

    gravity: new Vector3(0, 1.0, 0),
    drag: 2.0,

    startColor: new Color(0xffffff),
    endColor: new Color(0xffffff),

    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -4, max: 4 },

    texture: 'assets/textures/flames_big.png',

    sizeOverTime: [
        { time: 0.0, value: 0.3 },
        { time: 0.1, value: 1.0 },
        { time: 0.6, value: 1.2 },
        { time: 1.0, value: 0.8 },
    ],
    alphaOverTime: [
        { time: 0.0, value: 1.0 },
        { time: 0.3, value: 1.0 },
        { time: 0.8, value: 0.8 },
        { time: 1.0, value: 0.0 },
    ],
    colorOverTime: [
        { time: 0.0, value: new Color(1.0, 1.0, 0.8) },
        { time: 0.2, value: new Color(1.0, 0.8, 0.4) },
        { time: 0.5, value: new Color(1.0, 0.5, 0.2) },
        { time: 1.0, value: new Color(0.6, 0.4, 0.1) },
    ],
}

/**
 * Configuration for small explosion flames - secondary bursts
 */
export const smallExplosionParticleConfig: ParticleSystemConfig = {
    position: new Vector3(0, 0, 0),

    emissionRate: 0,
    burstCount: 20,
    burstInterval: -1,

    life: { min: 0.6, max: 1.0 },
    size: { min: 1.5, max: 3.0 },
    speed: { min: 2.0, max: 6.0 },

    spawnArea: {
        type: 'sphere',
        size: new Vector3(1.0, 0.5, 1.0),
    },

    direction: new Vector3(0, 1, 0),
    directionSpread: Math.PI,

    gravity: new Vector3(0, 0.5, 0),
    drag: 1.5,

    startColor: new Color(0xffffff),
    endColor: new Color(0xffffff),

    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -6, max: 6 },

    texture: 'assets/textures/flames_small.png',
    spriteSheet: {
        columns: 2,
        rows: 2,
        frameDuration: 0.08,
        randomStartFrame: true,
    },

    sizeOverTime: [
        { time: 0.0, value: 0.5 },
        { time: 0.2, value: 1.0 },
        { time: 1.0, value: 1.3 },
    ],
    alphaOverTime: [
        { time: 0.0, value: 1.0 },
        { time: 0.4, value: 1.0 },
        { time: 1.0, value: 0.0 },
    ],
    colorOverTime: [
        { time: 0.0, value: new Color(1.0, 1.0, 0.9) },
        { time: 0.3, value: new Color(1.0, 0.7, 0.3) },
        { time: 0.7, value: new Color(1.0, 0.4, 0.1) },
        { time: 1.0, value: new Color(0.5, 0.3, 0.0) },
    ],
}

/**
 * Configuration for nuclear-style explosion flames - intense core blast
 */
export const nukeExplosionParticleConfig: ParticleSystemConfig = {
    position: new Vector3(0, 0, 0),

    emissionRate: 0,
    burstCount: 8,
    burstInterval: -1,

    life: { min: 1.0, max: 1.5 },
    size: { min: 4.0, max: 7.0 },
    speed: { min: 1.0, max: 3.0 },

    spawnArea: {
        type: 'point',
        size: new Vector3(0, 0, 0),
    },

    direction: new Vector3(0, 1, 0),
    directionSpread: Math.PI * 0.4,

    gravity: new Vector3(0, 2.0, 0),
    drag: 3.0,

    startColor: new Color(0xffffff),
    endColor: new Color(0xffffff),

    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -2, max: 2 },

    texture: 'assets/textures/nuke_flames.png',

    sizeOverTime: [
        { time: 0.0, value: 0.1 },
        { time: 0.05, value: 1.0 },
        { time: 0.3, value: 1.5 },
        { time: 1.0, value: 1.0 },
    ],
    alphaOverTime: [
        { time: 0.0, value: 1.0 },
        { time: 0.1, value: 1.0 },
        { time: 0.7, value: 0.9 },
        { time: 1.0, value: 0.0 },
    ],
    colorOverTime: [
        { time: 0.0, value: new Color(1.0, 1.0, 1.0) },
        { time: 0.1, value: new Color(1.0, 1.0, 0.6) },
        { time: 0.4, value: new Color(1.0, 0.6, 0.2) },
        { time: 0.8, value: new Color(0.8, 0.3, 0.1) },
        { time: 1.0, value: new Color(0.4, 0.2, 0.0) },
    ],
}

/**
 * Configuration for explosion smoke - lingering aftermath
 */
export const explosionSmokeParticleConfig: ParticleSystemConfig = {
    position: new Vector3(0, 0, 0),

    emissionRate: 0,
    burstCount: 15,
    burstInterval: -1,

    life: { min: 2.0, max: 3.5 },
    size: { min: 2.0, max: 4.0 },
    speed: { min: 1.0, max: 3.0 },

    spawnArea: {
        type: 'sphere',
        size: new Vector3(1.5, 0.8, 1.5),
    },

    direction: new Vector3(0, 1, 0),
    directionSpread: Math.PI * 0.6,

    gravity: new Vector3(0, 1.5, 0),
    drag: 1.0,

    startColor: new Color(0xffffff),
    endColor: new Color(0xffffff),

    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -1, max: 1 },

    texture: 'assets/textures/smoke.png',

    sizeOverTime: [
        { time: 0.0, value: 0.5 },
        { time: 0.3, value: 1.0 },
        { time: 1.0, value: 2.0 },
    ],
    alphaOverTime: [
        { time: 0.0, value: 0.8 },
        { time: 0.2, value: 0.9 },
        { time: 0.6, value: 0.7 },
        { time: 1.0, value: 0.0 },
    ],
    colorOverTime: [
        { time: 0.0, value: new Color(0.9, 0.9, 0.9) },
        { time: 0.3, value: new Color(0.7, 0.7, 0.7) },
        { time: 0.7, value: new Color(0.5, 0.5, 0.5) },
        { time: 1.0, value: new Color(0.3, 0.3, 0.3) },
    ],
}

export const sparksParticleConfig: ParticleSystemConfig = {
    position: new Vector3(0, 0, 0),

    emissionRate: 0,
    burstCount: 20,
    burstInterval: -1,

    life: { min: 1.5, max: 2.0 },
    size: { min: 0.25, max: 0.75 },
    speed: { min: 5.0, max: 7.0 },

    spawnArea: {
        type: 'sphere',
        size: new Vector3(1.5, 1.5, 1.5),
    },

    direction: new Vector3(0, 1, 0),
    directionSpread: Math.PI * 0.3,

    gravity: new Vector3(0, 0.5, 0),
    drag: 1.0,

    startColor: new Color(0xfeff2a),
    endColor: new Color(0xff9f4a),

    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -1, max: 1 },

    texture: 'assets/sprites/spark.png',

    // sizeOverTime: [
    //     { time: 0.0, value: 0.5 },
    //     { time: 0.3, value: 1.0 },
    //     { time: 1.0, value: 2.0 },
    // ],
    alphaOverTime: [
        { time: 0.0, value: 0.0 },
        { time: 0.2, value: 1.0 },
        { time: 0.6, value: 1.0 },
        { time: 1.0, value: 0.0 },
    ],
}

/**
 * All particle configurations for easy access
 */
export const particleConfigs = {
    gunSmoke: gunSmokeParticleConfig,
    wreckage: wreckageParticleConfig,
    deathWreckage: deathWreckageParticleConfig,
    bigExplosion: bigExplosionParticleConfig,
    smallExplosion: smallExplosionParticleConfig,
    nukeExplosion: nukeExplosionParticleConfig,
    explosionSmoke: explosionSmokeParticleConfig,
    sparks: sparksParticleConfig,
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
