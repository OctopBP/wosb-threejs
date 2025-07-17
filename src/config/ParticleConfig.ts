import { Vector3 } from 'three'

export interface ParticleSystemConfig {
    // Basic properties
    maxParticles: number
    
    // Emission properties
    emissionRate?: number // particles per second (for constant emission)
    burstCount?: number // number of particles to emit at once (for burst)
    
    // Particle properties
    life: {
        min: number
        max: number
    }
    
    // Position
    position?: {
        x: number
        y: number
        z: number
    }
    positionSpread?: {
        x: number
        y: number
        z: number
    }
    
    // Velocity
    velocity?: Vector3
    velocitySpread?: {
        x: number
        y: number
        z: number
    }
    
    // Visual properties
    size: {
        start: number
        end: number
    }
    color: {
        start: { r: number; g: number; b: number; a: number }
        end: { r: number; g: number; b: number; a: number }
    }
    
    // Rendering
    renderType: 'sprite' | 'shape' | 'spritesheet'
    texture?: string // path to texture for sprite/spritesheet
    spriteSheetConfig?: {
        columns: number
        rows: number
        animationSpeed: number // frames per second
        loop: boolean
    }
    
    // Physics
    gravity?: Vector3
    acceleration?: Vector3
    
    // Behavior
    autoRemove: boolean // remove system when particles are done
}

// Predefined particle configurations
export const PARTICLE_PRESETS: Record<string, ParticleSystemConfig> = {
    gunSmoke: {
        maxParticles: 15,
        burstCount: 6,
        life: { min: 0.8, max: 1.5 },
        positionSpread: { x: 0.15, y: 0.1, z: 0.15 },
        velocity: new Vector3(0, 2, 0),
        velocitySpread: { x: 1.5, y: 0.8, z: 1.5 },
        size: { start: 0.15, end: 0.6 },
        color: {
            start: { r: 0.9, g: 0.9, b: 0.9, a: 0.7 },
            end: { r: 0.6, g: 0.6, b: 0.6, a: 0.0 }
        },
        renderType: 'sprite', // Use smoke texture
        gravity: new Vector3(0, -0.3, 0),
        autoRemove: true
    },
    
    muzzleFlash: {
        maxParticles: 3,
        burstCount: 2,
        life: { min: 0.05, max: 0.15 },
        positionSpread: { x: 0.03, y: 0.03, z: 0.03 },
        velocity: new Vector3(0, 0, 2),
        velocitySpread: { x: 0.3, y: 0.3, z: 1 },
        size: { start: 0.25, end: 0.05 },
        color: {
            start: { r: 1.0, g: 0.9, b: 0.5, a: 1.0 },
            end: { r: 1.0, g: 0.3, b: 0.0, a: 0.0 }
        },
        renderType: 'sprite', // Use spark texture
        autoRemove: true
    },
    
    constantSmoke: {
        maxParticles: 50,
        emissionRate: 20,
        life: { min: 2.0, max: 3.0 },
        positionSpread: { x: 0.2, y: 0.1, z: 0.2 },
        velocity: new Vector3(0, 2, 0),
        velocitySpread: { x: 1, y: 0.5, z: 1 },
        size: { start: 0.1, end: 0.8 },
        color: {
            start: { r: 0.9, g: 0.9, b: 0.9, a: 0.6 },
            end: { r: 0.7, g: 0.7, b: 0.7, a: 0.0 }
        },
        renderType: 'shape',
        gravity: new Vector3(0, 0.1, 0),
        autoRemove: false
    }
}