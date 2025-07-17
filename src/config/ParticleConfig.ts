import type { ParticleEmitterComponent } from '../ecs/Component'

// Particle effect presets for common use cases
export type ParticlePresetName =
    | 'explosion'
    | 'smoke'
    | 'fire'
    | 'sparks'
    | 'healing'
    | 'projectileTrail'
    | 'debris'
    | 'magic'
    | 'steam'
    | 'blood'

// Base particle emitter configuration (without ECS type and particles array)
export interface ParticleEmitterConfig {
    // Emission properties
    isActive: boolean
    emissionType: 'burst' | 'continuous'
    particleCount: number
    duration: number

    // Particle appearance
    particleType: 'sprite' | 'spriteSheet' | 'shape'
    texture?: string
    spriteSheetConfig?: {
        columns: number
        rows: number
        totalFrames: number
        animationSpeed: number
        randomStartFrame: boolean
    }
    shapeConfig?: {
        type: 'circle' | 'square' | 'triangle'
        color: number
        opacity: number
    }

    // Particle physics
    startPosition: { x: number; y: number; z: number }
    positionVariance: { x: number; y: number; z: number }
    startVelocity: { x: number; y: number; z: number }
    velocityVariance: { x: number; y: number; z: number }
    acceleration: { x: number; y: number; z: number }

    // Particle lifecycle
    particleLifetime: number
    lifetimeVariance: number

    // Size properties
    startSize: number
    endSize: number
    sizeVariance: number

    // Color/opacity animation
    startColor?: { r: number; g: number; b: number }
    endColor?: { r: number; g: number; b: number }
    startOpacity: number
    endOpacity: number

    // Limits
    maxParticles: number
}

// Preset configurations
export const PARTICLE_PRESETS: Record<
    ParticlePresetName,
    ParticleEmitterConfig
> = {
    explosion: {
        isActive: true,
        emissionType: 'burst',
        particleCount: 50,
        duration: 0,
        particleType: 'shape',
        shapeConfig: {
            type: 'circle',
            color: 0xff4400,
            opacity: 1.0,
        },
        startPosition: { x: 0, y: 0, z: 0 },
        positionVariance: { x: 0.5, y: 0.5, z: 0.5 },
        startVelocity: { x: 0, y: 0, z: 0 },
        velocityVariance: { x: 8, y: 8, z: 8 },
        acceleration: { x: 0, y: -5, z: 0 },
        particleLifetime: 1.5,
        lifetimeVariance: 0.5,
        startSize: 0.3,
        endSize: 0.05,
        sizeVariance: 0.1,
        startColor: { r: 1, g: 0.3, b: 0 },
        endColor: { r: 0.2, g: 0.1, b: 0 },
        startOpacity: 1.0,
        endOpacity: 0.0,
        maxParticles: 100,
    },

    smoke: {
        isActive: true,
        emissionType: 'continuous',
        particleCount: 10, // particles per second
        duration: 0, // infinite
        particleType: 'shape',
        shapeConfig: {
            type: 'circle',
            color: 0x555555,
            opacity: 0.6,
        },
        startPosition: { x: 0, y: 0, z: 0 },
        positionVariance: { x: 0.3, y: 0.1, z: 0.3 },
        startVelocity: { x: 0, y: 2, z: 0 },
        velocityVariance: { x: 1, y: 0.5, z: 1 },
        acceleration: { x: 0, y: 0.5, z: 0 },
        particleLifetime: 3.0,
        lifetimeVariance: 1.0,
        startSize: 0.2,
        endSize: 0.8,
        sizeVariance: 0.2,
        startColor: { r: 0.4, g: 0.4, b: 0.4 },
        endColor: { r: 0.2, g: 0.2, b: 0.2 },
        startOpacity: 0.8,
        endOpacity: 0.0,
        maxParticles: 50,
    },

    fire: {
        isActive: true,
        emissionType: 'continuous',
        particleCount: 20,
        duration: 0,
        particleType: 'shape',
        shapeConfig: {
            type: 'circle',
            color: 0xff6600,
            opacity: 0.8,
        },
        startPosition: { x: 0, y: 0, z: 0 },
        positionVariance: { x: 0.2, y: 0.1, z: 0.2 },
        startVelocity: { x: 0, y: 3, z: 0 },
        velocityVariance: { x: 0.5, y: 1, z: 0.5 },
        acceleration: { x: 0, y: 1, z: 0 },
        particleLifetime: 1.5,
        lifetimeVariance: 0.5,
        startSize: 0.15,
        endSize: 0.05,
        sizeVariance: 0.05,
        startColor: { r: 1, g: 0.5, b: 0 },
        endColor: { r: 1, g: 0.1, b: 0 },
        startOpacity: 1.0,
        endOpacity: 0.0,
        maxParticles: 40,
    },

    sparks: {
        isActive: true,
        emissionType: 'burst',
        particleCount: 25,
        duration: 0,
        particleType: 'shape',
        shapeConfig: {
            type: 'circle',
            color: 0xffff00,
            opacity: 1.0,
        },
        startPosition: { x: 0, y: 0, z: 0 },
        positionVariance: { x: 0.1, y: 0.1, z: 0.1 },
        startVelocity: { x: 0, y: 0, z: 0 },
        velocityVariance: { x: 6, y: 6, z: 6 },
        acceleration: { x: 0, y: -8, z: 0 },
        particleLifetime: 0.8,
        lifetimeVariance: 0.3,
        startSize: 0.08,
        endSize: 0.02,
        sizeVariance: 0.03,
        startColor: { r: 1, g: 1, b: 0.5 },
        endColor: { r: 1, g: 0.3, b: 0 },
        startOpacity: 1.0,
        endOpacity: 0.0,
        maxParticles: 50,
    },

    healing: {
        isActive: true,
        emissionType: 'continuous',
        particleCount: 8,
        duration: 2.0,
        particleType: 'shape',
        shapeConfig: {
            type: 'circle',
            color: 0x00ff88,
            opacity: 0.8,
        },
        startPosition: { x: 0, y: 0, z: 0 },
        positionVariance: { x: 0.5, y: 0.2, z: 0.5 },
        startVelocity: { x: 0, y: 2, z: 0 },
        velocityVariance: { x: 0.5, y: 0.5, z: 0.5 },
        acceleration: { x: 0, y: 0.5, z: 0 },
        particleLifetime: 2.5,
        lifetimeVariance: 0.5,
        startSize: 0.1,
        endSize: 0.3,
        sizeVariance: 0.05,
        startColor: { r: 0, g: 1, b: 0.6 },
        endColor: { r: 0.5, g: 1, b: 0.8 },
        startOpacity: 1.0,
        endOpacity: 0.0,
        maxParticles: 30,
    },

    projectileTrail: {
        isActive: true,
        emissionType: 'continuous',
        particleCount: 30,
        duration: 0,
        particleType: 'shape',
        shapeConfig: {
            type: 'circle',
            color: 0x00aaff,
            opacity: 0.7,
        },
        startPosition: { x: 0, y: 0, z: 0 },
        positionVariance: { x: 0.1, y: 0.1, z: 0.1 },
        startVelocity: { x: 0, y: 0, z: 0 },
        velocityVariance: { x: 0.2, y: 0.2, z: 0.2 },
        acceleration: { x: 0, y: 0, z: 0 },
        particleLifetime: 0.5,
        lifetimeVariance: 0.1,
        startSize: 0.15,
        endSize: 0.02,
        sizeVariance: 0.03,
        startColor: { r: 0, g: 0.7, b: 1 },
        endColor: { r: 0, g: 0.3, b: 0.8 },
        startOpacity: 1.0,
        endOpacity: 0.0,
        maxParticles: 20,
    },

    debris: {
        isActive: true,
        emissionType: 'burst',
        particleCount: 30,
        duration: 0,
        particleType: 'shape',
        shapeConfig: {
            type: 'square',
            color: 0x664422,
            opacity: 1.0,
        },
        startPosition: { x: 0, y: 0, z: 0 },
        positionVariance: { x: 0.3, y: 0.3, z: 0.3 },
        startVelocity: { x: 0, y: 0, z: 0 },
        velocityVariance: { x: 5, y: 7, z: 5 },
        acceleration: { x: 0, y: -9, z: 0 },
        particleLifetime: 2.0,
        lifetimeVariance: 0.8,
        startSize: 0.1,
        endSize: 0.05,
        sizeVariance: 0.05,
        startOpacity: 1.0,
        endOpacity: 1.0,
        maxParticles: 50,
    },

    magic: {
        isActive: true,
        emissionType: 'continuous',
        particleCount: 15,
        duration: 0,
        particleType: 'shape',
        shapeConfig: {
            type: 'circle',
            color: 0x8800ff,
            opacity: 0.9,
        },
        startPosition: { x: 0, y: 0, z: 0 },
        positionVariance: { x: 0.4, y: 0.4, z: 0.4 },
        startVelocity: { x: 0, y: 1, z: 0 },
        velocityVariance: { x: 1, y: 1, z: 1 },
        acceleration: { x: 0, y: 0.2, z: 0 },
        particleLifetime: 2.0,
        lifetimeVariance: 0.5,
        startSize: 0.08,
        endSize: 0.2,
        sizeVariance: 0.04,
        startColor: { r: 0.5, g: 0, b: 1 },
        endColor: { r: 1, g: 0.5, b: 1 },
        startOpacity: 1.0,
        endOpacity: 0.0,
        maxParticles: 35,
    },

    steam: {
        isActive: true,
        emissionType: 'continuous',
        particleCount: 12,
        duration: 0,
        particleType: 'shape',
        shapeConfig: {
            type: 'circle',
            color: 0xaaaaaa,
            opacity: 0.4,
        },
        startPosition: { x: 0, y: 0, z: 0 },
        positionVariance: { x: 0.2, y: 0.1, z: 0.2 },
        startVelocity: { x: 0, y: 2.5, z: 0 },
        velocityVariance: { x: 0.8, y: 0.5, z: 0.8 },
        acceleration: { x: 0, y: 0.3, z: 0 },
        particleLifetime: 2.5,
        lifetimeVariance: 0.8,
        startSize: 0.1,
        endSize: 0.6,
        sizeVariance: 0.1,
        startColor: { r: 0.8, g: 0.8, b: 0.8 },
        endColor: { r: 0.6, g: 0.6, b: 0.6 },
        startOpacity: 0.6,
        endOpacity: 0.0,
        maxParticles: 40,
    },

    blood: {
        isActive: true,
        emissionType: 'burst',
        particleCount: 20,
        duration: 0,
        particleType: 'shape',
        shapeConfig: {
            type: 'circle',
            color: 0x990000,
            opacity: 1.0,
        },
        startPosition: { x: 0, y: 0, z: 0 },
        positionVariance: { x: 0.2, y: 0.2, z: 0.2 },
        startVelocity: { x: 0, y: 0, z: 0 },
        velocityVariance: { x: 3, y: 4, z: 3 },
        acceleration: { x: 0, y: -6, z: 0 },
        particleLifetime: 1.2,
        lifetimeVariance: 0.4,
        startSize: 0.08,
        endSize: 0.15,
        sizeVariance: 0.04,
        startColor: { r: 0.8, g: 0, b: 0 },
        endColor: { r: 0.4, g: 0, b: 0 },
        startOpacity: 1.0,
        endOpacity: 0.8,
        maxParticles: 30,
    },
}

// Helper function to create a particle emitter component from a preset
export function createParticleEmitter(
    presetName: ParticlePresetName,
    overrides: Partial<ParticleEmitterConfig> = {},
): ParticleEmitterComponent {
    const preset = PARTICLE_PRESETS[presetName]
    if (!preset) {
        throw new Error(`Unknown particle preset: ${presetName}`)
    }

    const config = { ...preset, ...overrides }

    return {
        type: 'particleEmitter',
        ...config,
        elapsedTime: 0,
        lastEmissionTime: 0,
        particles: [],
    }
}

// Helper function to create a custom particle emitter
export function createCustomParticleEmitter(
    config: ParticleEmitterConfig,
): ParticleEmitterComponent {
    return {
        type: 'particleEmitter',
        ...config,
        elapsedTime: 0,
        lastEmissionTime: 0,
        particles: [],
    }
}

// Utility functions for common particle effect modifications
export const ParticleUtils = {
    // Scale particle count for performance
    scaleParticleCount(
        config: ParticleEmitterConfig,
        scale: number,
    ): ParticleEmitterConfig {
        return {
            ...config,
            particleCount: Math.max(
                1,
                Math.floor(config.particleCount * scale),
            ),
            maxParticles: Math.max(1, Math.floor(config.maxParticles * scale)),
        }
    },

    // Adjust lifetime for longer/shorter effects
    scaleLifetime(
        config: ParticleEmitterConfig,
        scale: number,
    ): ParticleEmitterConfig {
        return {
            ...config,
            particleLifetime: config.particleLifetime * scale,
            lifetimeVariance: config.lifetimeVariance * scale,
            duration:
                config.duration > 0 ? config.duration * scale : config.duration,
        }
    },

    // Change colors while keeping the same effect structure
    recolor(
        config: ParticleEmitterConfig,
        startColor: { r: number; g: number; b: number },
        endColor?: { r: number; g: number; b: number },
    ): ParticleEmitterConfig {
        return {
            ...config,
            startColor,
            endColor: endColor || startColor,
            shapeConfig: config.shapeConfig
                ? {
                      ...config.shapeConfig,
                      color:
                          (Math.floor(startColor.r * 255) << 16) |
                          (Math.floor(startColor.g * 255) << 8) |
                          Math.floor(startColor.b * 255),
                  }
                : config.shapeConfig,
        }
    },

    // Scale particle size
    scaleSize(
        config: ParticleEmitterConfig,
        scale: number,
    ): ParticleEmitterConfig {
        return {
            ...config,
            startSize: config.startSize * scale,
            endSize: config.endSize * scale,
            sizeVariance: config.sizeVariance * scale,
        }
    },
}
