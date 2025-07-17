import {
    createCustomParticleEmitter,
    createParticleEmitter,
    type ParticleEmitterConfig,
    type ParticlePresetName,
} from '../config/ParticleConfig'
import type {
    ParticleEmitterComponent,
    PositionComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import type { World } from '../ecs/World'

export class ParticleFactory {
    private world: World

    constructor(world: World) {
        this.world = world
    }

    /**
     * Create a particle effect using a preset at a specific position
     */
    createParticleEffect(
        presetName: ParticlePresetName,
        position: { x: number; y: number; z: number },
        overrides: Partial<ParticleEmitterConfig> = {},
    ): Entity {
        const entity = this.world.createEntity()

        // Add position component
        const positionComponent: PositionComponent = {
            type: 'position',
            x: position.x,
            y: position.y,
            z: position.z,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
        }

        // Create particle emitter component from preset
        const particleEmitter = createParticleEmitter(presetName, overrides)

        entity.addComponent(positionComponent)
        entity.addComponent(particleEmitter)

        return entity
    }

    /**
     * Create a custom particle effect at a specific position
     */
    createCustomParticleEffect(
        config: ParticleEmitterConfig,
        position: { x: number; y: number; z: number },
    ): Entity {
        const entity = this.world.createEntity()

        // Add position component
        const positionComponent: PositionComponent = {
            type: 'position',
            x: position.x,
            y: position.y,
            z: position.z,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
        }

        // Create particle emitter component from custom config
        const particleEmitter = createCustomParticleEmitter(config)

        entity.addComponent(positionComponent)
        entity.addComponent(particleEmitter)

        return entity
    }

    /**
     * Add a particle emitter to an existing entity
     */
    addParticleEmitterToEntity(
        entity: Entity,
        presetName: ParticlePresetName,
        overrides: Partial<ParticleEmitterConfig> = {},
    ): void {
        const particleEmitter = createParticleEmitter(presetName, overrides)
        entity.addComponent(particleEmitter)
    }

    /**
     * Add a custom particle emitter to an existing entity
     */
    addCustomParticleEmitterToEntity(
        entity: Entity,
        config: ParticleEmitterConfig,
    ): void {
        const particleEmitter = createCustomParticleEmitter(config)
        entity.addComponent(particleEmitter)
    }

    /**
     * Create an explosion effect at the specified position
     */
    createExplosion(
        position: { x: number; y: number; z: number },
        intensity: 'small' | 'medium' | 'large' = 'medium',
    ): Entity {
        const intensityOverrides = {
            small: { particleCount: 25, maxParticles: 50 },
            medium: { particleCount: 50, maxParticles: 100 },
            large: { particleCount: 100, maxParticles: 200 },
        }

        return this.createParticleEffect(
            'explosion',
            position,
            intensityOverrides[intensity],
        )
    }

    /**
     * Create a projectile trail effect attached to an entity
     */
    createProjectileTrail(entity: Entity): void {
        this.addParticleEmitterToEntity(entity, 'projectileTrail')
    }

    /**
     * Create a healing effect at the specified position
     */
    createHealingEffect(position: { x: number; y: number; z: number }): Entity {
        return this.createParticleEffect('healing', position)
    }

    /**
     * Create debris effect from destroyed objects
     */
    createDebris(
        position: { x: number; y: number; z: number },
        amount: 'few' | 'normal' | 'many' = 'normal',
    ): Entity {
        const amountOverrides = {
            few: { particleCount: 15, maxParticles: 25 },
            normal: { particleCount: 30, maxParticles: 50 },
            many: { particleCount: 60, maxParticles: 100 },
        }

        return this.createParticleEffect(
            'debris',
            position,
            amountOverrides[amount],
        )
    }

    /**
     * Create spark effect for impacts and collisions
     */
    createSparks(position: { x: number; y: number; z: number }): Entity {
        return this.createParticleEffect('sparks', position)
    }

    /**
     * Create a continuous fire effect
     */
    createFire(position: { x: number; y: number; z: number }): Entity {
        return this.createParticleEffect('fire', position)
    }

    /**
     * Create a continuous smoke effect
     */
    createSmoke(position: { x: number; y: number; z: number }): Entity {
        return this.createParticleEffect('smoke', position)
    }

    /**
     * Create a magic effect
     */
    createMagicEffect(position: { x: number; y: number; z: number }): Entity {
        return this.createParticleEffect('magic', position)
    }

    /**
     * Create steam effect
     */
    createSteam(position: { x: number; y: number; z: number }): Entity {
        return this.createParticleEffect('steam', position)
    }

    /**
     * Create blood effect for damage
     */
    createBloodEffect(position: { x: number; y: number; z: number }): Entity {
        return this.createParticleEffect('blood', position)
    }

    /**
     * Stop all particle emitters on an entity
     */
    stopParticleEmitters(entity: Entity): void {
        const emitter =
            entity.getComponent<ParticleEmitterComponent>('particleEmitter')
        if (emitter) {
            emitter.isActive = false
        }
    }

    /**
     * Start/restart particle emitters on an entity
     */
    startParticleEmitters(entity: Entity): void {
        const emitter =
            entity.getComponent<ParticleEmitterComponent>('particleEmitter')
        if (emitter) {
            emitter.isActive = true
            emitter.elapsedTime = 0
            emitter.lastEmissionTime = 0
        }
    }

    /**
     * Create a sprite-based particle effect (requires texture)
     */
    createSpriteParticleEffect(
        position: { x: number; y: number; z: number },
        texturePath: string,
        config: Partial<ParticleEmitterConfig> = {},
    ): Entity {
        const spriteConfig: ParticleEmitterConfig = {
            isActive: true,
            emissionType: 'burst',
            particleCount: 20,
            duration: 0,
            particleType: 'sprite',
            texture: texturePath,
            startPosition: { x: 0, y: 0, z: 0 },
            positionVariance: { x: 0.5, y: 0.5, z: 0.5 },
            startVelocity: { x: 0, y: 0, z: 0 },
            velocityVariance: { x: 2, y: 2, z: 2 },
            acceleration: { x: 0, y: -2, z: 0 },
            particleLifetime: 2.0,
            lifetimeVariance: 0.5,
            startSize: 0.5,
            endSize: 0.1,
            sizeVariance: 0.1,
            startOpacity: 1.0,
            endOpacity: 0.0,
            maxParticles: 50,
            ...config,
        }

        return this.createCustomParticleEffect(spriteConfig, position)
    }

    /**
     * Create a sprite sheet animation particle effect
     */
    createSpriteSheetParticleEffect(
        position: { x: number; y: number; z: number },
        texturePath: string,
        spriteSheetConfig: {
            columns: number
            rows: number
            totalFrames: number
            animationSpeed: number
            randomStartFrame?: boolean
        },
        config: Partial<ParticleEmitterConfig> = {},
    ): Entity {
        const spriteSheetParticleConfig: ParticleEmitterConfig = {
            isActive: true,
            emissionType: 'burst',
            particleCount: 15,
            duration: 0,
            particleType: 'spriteSheet',
            texture: texturePath,
            spriteSheetConfig: {
                randomStartFrame: false,
                ...spriteSheetConfig,
            },
            startPosition: { x: 0, y: 0, z: 0 },
            positionVariance: { x: 0.3, y: 0.3, z: 0.3 },
            startVelocity: { x: 0, y: 0, z: 0 },
            velocityVariance: { x: 2, y: 2, z: 2 },
            acceleration: { x: 0, y: -1, z: 0 },
            particleLifetime: 2.0,
            lifetimeVariance: 0.3,
            startSize: 0.4,
            endSize: 0.2,
            sizeVariance: 0.1,
            startOpacity: 1.0,
            endOpacity: 0.0,
            maxParticles: 30,
            ...config,
        }

        return this.createCustomParticleEffect(
            spriteSheetParticleConfig,
            position,
        )
    }
}
