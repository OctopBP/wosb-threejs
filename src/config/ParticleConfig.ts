import type { Vector3 } from 'three'

export interface ParticleSystemConfig {
    name: string
    particleCount: number
    lifetime: {
        min: number
        max: number
    }
    colors: string[]
    size: {
        min: number
        max: number
    }
    velocity: {
        min: number
        max: number
    }
    acceleration?: {
        x: number
        y: number
        z: number
    }
    alpha: {
        start: number
        end: number
    }
    scale: {
        start: number
        end: number
    }
    rotation?: {
        min: number
        max: number
    }
    emissionRate: number
    duration?: number // How long the emitter should run (undefined = continuous)
    texture?: string // Optional texture path
    blending?: 'normal' | 'additive' | 'subtractive' | 'multiply'
}

export const PARTICLE_CONFIGS: Record<string, ParticleSystemConfig> = {
    explosion: {
        name: 'explosion',
        particleCount: 50,
        lifetime: { min: 0.5, max: 1.5 },
        colors: ['#ff4444', '#ff8844', '#ffaa44', '#ffcc88'],
        size: { min: 0.1, max: 0.5 },
        velocity: { min: 2, max: 8 },
        acceleration: { x: 0, y: 0, z: 0 },
        alpha: { start: 1.0, end: 0.0 },
        scale: { start: 0.1, end: 1.0 },
        rotation: { min: 0, max: Math.PI * 2 },
        emissionRate: 100,
        duration: 0.5,
        blending: 'additive'
    },

    thrust: {
        name: 'thrust',
        particleCount: 30,
        lifetime: { min: 0.2, max: 0.6 },
        colors: ['#4488ff', '#88ccff', '#aaddff'],
        size: { min: 0.05, max: 0.2 },
        velocity: { min: 1, max: 3 },
        acceleration: { x: 0, y: 0, z: -5 },
        alpha: { start: 0.8, end: 0.0 },
        scale: { start: 1.0, end: 0.2 },
        emissionRate: 60,
        blending: 'additive'
    },

    muzzleFlash: {
        name: 'muzzleFlash',
        particleCount: 15,
        lifetime: { min: 0.1, max: 0.3 },
        colors: ['#ffff44', '#ffaa44', '#ff8844'],
        size: { min: 0.05, max: 0.15 },
        velocity: { min: 1, max: 4 },
        alpha: { start: 1.0, end: 0.0 },
        scale: { start: 0.5, end: 1.5 },
        rotation: { min: 0, max: Math.PI * 2 },
        emissionRate: 50,
        duration: 0.2,
        blending: 'additive'
    },

    impact: {
        name: 'impact',
        particleCount: 20,
        lifetime: { min: 0.3, max: 0.8 },
        colors: ['#ffffff', '#ffcccc', '#ff8888'],
        size: { min: 0.02, max: 0.1 },
        velocity: { min: 0.5, max: 2 },
        alpha: { start: 1.0, end: 0.0 },
        scale: { start: 1.0, end: 0.5 },
        emissionRate: 40,
        duration: 0.3,
        blending: 'additive'
    },

    damage: {
        name: 'damage',
        particleCount: 10,
        lifetime: { min: 0.5, max: 1.0 },
        colors: ['#ff0000', '#ff4444', '#ff8888'],
        size: { min: 0.05, max: 0.15 },
        velocity: { min: 0.5, max: 2 },
        acceleration: { x: 0, y: 2, z: 0 },
        alpha: { start: 1.0, end: 0.0 },
        scale: { start: 1.0, end: 0.8 },
        emissionRate: 20,
        duration: 0.5,
        blending: 'normal'
    },

    death: {
        name: 'death',
        particleCount: 80,
        lifetime: { min: 1.0, max: 2.5 },
        colors: ['#ff0000', '#ff4444', '#ff8844', '#ffaa44', '#444444'],
        size: { min: 0.1, max: 0.8 },
        velocity: { min: 1, max: 6 },
        acceleration: { x: 0, y: -2, z: 0 },
        alpha: { start: 1.0, end: 0.0 },
        scale: { start: 0.2, end: 2.0 },
        rotation: { min: 0, max: Math.PI * 2 },
        emissionRate: 120,
        duration: 1.0,
        blending: 'additive'
    }
}

export function getParticleConfig(systemType: string): ParticleSystemConfig {
    return PARTICLE_CONFIGS[systemType] || PARTICLE_CONFIGS.impact
}