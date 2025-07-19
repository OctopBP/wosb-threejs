import { Color, Vector3 } from 'three'
import type { ParticleSystemConfig } from '../systems/ParticleSystem'

/**
 * Configuration for gunsmoke particles that appear when weapons fire
 */
export const gunsmokeParticleConfig: ParticleSystemConfig = {
    id: 'gunsmoke',
    position: new Vector3(0, 0, 0), // Will be set dynamically at shooting point
    
    // Emission settings - burst only on weapon fire
    emissionRate: 0, // No continuous emission
    burstCount: 8, // Number of particles per shot
    burstInterval: -1, // No automatic bursts
    
    // Particle properties
    life: { min: 0.8, max: 1.5 },
    size: { min: 1.5, max: 3.0 },
    speed: { min: 2.0, max: 6.0 },
    
    // Spawn area - small area around muzzle
    spawnArea: {
        type: 'box',
        size: new Vector3(0.3, 0.2, 0.3)
    },
    
    // Direction - forward with spread (like muzzle blast)
    direction: new Vector3(0, 0, 1), // Will be rotated based on weapon direction
    directionSpread: Math.PI * 0.25, // 45 degree spread
    
    // Physics
    gravity: new Vector3(0, -2.0, 0), // Light downward pull
    drag: 1.2, // Smoke dissipates quickly
    
    // Visual properties
    startColor: new Color(0xdddddd), // Light gray smoke
    endColor: new Color(0x333333), // Dark gray
    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -2, max: 2 },
    
    // Texture
    texture: 'assets/sprites/gunsmoke.png',
    
    // Animation curves for realistic smoke behavior
    sizeOverTime: [
        { time: 0.0, value: 0.5 }, // Start small
        { time: 0.3, value: 1.2 }, // Expand quickly
        { time: 1.0, value: 2.0 }  // Continue expanding
    ],
    alphaOverTime: [
        { time: 0.0, value: 0.8 }, // Start visible
        { time: 0.4, value: 0.9 }, // Peak visibility
        { time: 1.0, value: 0.0 }  // Fade out
    ]
}

/**
 * Configuration for muzzle flash particles - bright, short-lived effect
 */
export const muzzleFlashParticleConfig: ParticleSystemConfig = {
    id: 'muzzleflash',
    position: new Vector3(0, 0, 0), // Will be set dynamically
    
    // Emission settings - quick burst
    emissionRate: 0,
    burstCount: 3,
    burstInterval: -1,
    
    // Particle properties - very short lived
    life: { min: 0.05, max: 0.15 },
    size: { min: 2.0, max: 4.0 },
    speed: { min: 0.5, max: 2.0 },
    
    // Spawn area - right at muzzle
    spawnArea: {
        type: 'point',
        size: new Vector3(0, 0, 0)
    },
    
    // Direction - forward cone
    direction: new Vector3(0, 0, 1),
    directionSpread: Math.PI * 0.15, // Tight cone
    
    // Physics - minimal
    gravity: new Vector3(0, 0, 0),
    drag: 0.5,
    
    // Visual properties - bright flash
    startColor: new Color(0xffffff), // Bright white
    endColor: new Color(0xffaa00), // Orange
    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -10, max: 10 },
    
    // Texture
    texture: 'assets/sprites/muzzleflash.png',
    
    // Quick flash animation
    alphaOverTime: [
        { time: 0.0, value: 1.0 }, // Instant bright
        { time: 0.3, value: 0.8 }, // Still visible
        { time: 1.0, value: 0.0 }  // Quick fade
    ]
}

/**
 * Configuration for bullet impact particles when projectiles hit targets
 */
export const bulletImpactParticleConfig: ParticleSystemConfig = {
    id: 'bulletimpact',
    position: new Vector3(0, 0, 0), // Will be set at impact point
    
    // Emission settings - single burst on impact
    emissionRate: 0,
    burstCount: 6,
    burstInterval: -1,
    
    // Particle properties
    life: { min: 0.3, max: 0.8 },
    size: { min: 0.8, max: 1.5 },
    speed: { min: 3.0, max: 8.0 },
    
    // Spawn area - small impact point
    spawnArea: {
        type: 'point',
        size: new Vector3(0, 0, 0)
    },
    
    // Direction - spray outward from impact
    direction: new Vector3(0, 1, 0), // Will be set based on impact normal
    directionSpread: Math.PI * 0.6, // Wide spray
    
    // Physics
    gravity: new Vector3(0, -15.0, 0), // Strong gravity
    drag: 2.0,
    
    // Visual properties - spark-like
    startColor: new Color(0xffff88), // Bright yellow
    endColor: new Color(0xff4444), // Red
    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -15, max: 15 },
    
    // Texture
    texture: 'assets/sprites/spark.png',
    
    // Quick spark effect
    sizeOverTime: [
        { time: 0.0, value: 1.0 },
        { time: 0.2, value: 0.8 },
        { time: 1.0, value: 0.2 }
    ]
}

/**
 * Configuration for explosion particles for larger impacts or effects
 */
export const explosionParticleConfig: ParticleSystemConfig = {
    id: 'explosion',
    position: new Vector3(0, 0, 0),
    
    // Emission settings - large burst
    emissionRate: 0,
    burstCount: 25,
    burstInterval: -1,
    
    // Particle properties
    life: { min: 0.5, max: 1.2 },
    size: { min: 2.0, max: 5.0 },
    speed: { min: 5.0, max: 15.0 },
    
    // Spawn area
    spawnArea: {
        type: 'sphere',
        size: new Vector3(0.5, 0, 0)
    },
    
    // Direction - all directions
    direction: new Vector3(0, 1, 0),
    directionSpread: Math.PI, // Full sphere
    
    // Physics
    gravity: new Vector3(0, -8.0, 0),
    drag: 1.5,
    
    // Visual properties
    startColor: new Color(0xffffff), // White
    endColor: new Color(0x440000), // Dark red
    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -8, max: 8 },
    
    // Texture
    texture: 'assets/sprites/explosion.png',
    
    // Explosion animation
    colorOverTime: [
        { time: 0.0, value: new Color(0xffffff) }, // White flash
        { time: 0.1, value: new Color(0xffff00) }, // Yellow
        { time: 0.4, value: new Color(0xff4400) }, // Orange
        { time: 1.0, value: new Color(0x440000) }  // Dark red
    ],
    sizeOverTime: [
        { time: 0.0, value: 0.2 },
        { time: 0.2, value: 1.5 },
        { time: 1.0, value: 0.5 }
    ]
}

/**
 * All particle configurations for easy access
 */
export const particleConfigs = {
    gunsmoke: gunsmokeParticleConfig,
    muzzleflash: muzzleFlashParticleConfig,
    bulletimpact: bulletImpactParticleConfig,
    explosion: explosionParticleConfig,
} as const

/**
 * Get a particle config by name with position override
 */
export function getParticleConfig(
    name: keyof typeof particleConfigs,
    position: Vector3,
    direction?: Vector3
): ParticleSystemConfig {
    const baseConfig = { ...particleConfigs[name] }
    baseConfig.position = position.clone()
    
    // Override direction if provided (useful for directional effects like gunsmoke)
    if (direction) {
        baseConfig.direction = direction.clone().normalize()
    }
    
    return baseConfig
}