import * as THREE from 'three'
import { 
    Scene, 
    Vector3, 
    Texture, 
    TextureLoader, 
    AdditiveBlending,
    CanvasTexture,
    SpriteMaterial,
    Sprite
} from 'three'
import type { ParticleComponent, PositionComponent } from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System as ECSSystem } from '../ecs/System'
import type { World } from '../ecs/World'
import type { ParticleSystemConfig } from '../config/ParticleConfig'
import { PARTICLE_PRESETS } from '../config/ParticleConfig'
import { createSmokeTexture, createSparkTexture } from '../utils/ParticleUtils'

export class ParticleSystem extends ECSSystem {
    private scene: Scene
    private nebulaSystem: any
    private particleSystems: Map<string, any> = new Map()
    private textureLoader: TextureLoader = new TextureLoader()
    private textureCache: Map<string, Texture> = new Map()
    private shapeTexture: CanvasTexture
    private smokeTexture: CanvasTexture
    private sparkTexture: CanvasTexture
    private Nebula: any

    constructor(world: World, scene: Scene) {
        super(world, ['particle', 'position'])
        this.scene = scene
        
        // Make THREE available globally for three-nebula
        if (typeof window !== 'undefined') {
            (window as any).THREE = THREE
        }
        
        // Import three-nebula dynamically
        this.initializeNebula()
        
        // Create default textures
        this.shapeTexture = this.createShapeTexture()
        this.smokeTexture = createSmokeTexture(64)
        this.sparkTexture = createSparkTexture(32)
    }

    private async initializeNebula() {
        try {
            this.Nebula = await import('three-nebula')
            this.nebulaSystem = new this.Nebula.System()
            this.nebulaSystem.addRenderer(new this.Nebula.SpriteRenderer(this.scene))
        } catch (error) {
            console.error('Failed to initialize three-nebula:', error)
        }
    }

    /**
     * Create a basic circular texture for shape-based particles
     */
    private createShapeTexture(): CanvasTexture {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const context = canvas.getContext('2d')!

        // Create radial gradient for soft circle
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

        context.fillStyle = gradient
        context.fillRect(0, 0, 64, 64)

        const texture = new CanvasTexture(canvas)
        return texture
    }

    /**
     * Load and cache a texture
     */
    private async loadTexture(path: string): Promise<Texture> {
        if (this.textureCache.has(path)) {
            return this.textureCache.get(path)!
        }

        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                path,
                (texture) => {
                    this.textureCache.set(path, texture)
                    resolve(texture)
                },
                undefined,
                reject
            )
        })
    }

    /**
     * Create a particle system from configuration
     */
    async createParticleSystem(
        id: string,
        config: ParticleSystemConfig,
        position: Vector3,
        presetName?: string
    ): Promise<any> {
        if (!this.Nebula) {
            console.warn('Nebula not initialized yet')
            return null
        }

        const emitter = new this.Nebula.Emitter()

        // Set position
        emitter.addInitialize(new this.Nebula.Position(position))
        emitter.addInitialize(new this.Nebula.Mass(1))
        
        // Set velocity
        if (config.velocity) {
            const velSpread = config.velocitySpread || { x: 0, y: 0, z: 0 }
            emitter.addInitialize(new this.Nebula.VectorVelocity(
                new this.Nebula.Span(config.velocity.x - velSpread.x, config.velocity.x + velSpread.x),
                new this.Nebula.Span(config.velocity.y - velSpread.y, config.velocity.y + velSpread.y),
                new this.Nebula.Span(config.velocity.z - velSpread.z, config.velocity.z + velSpread.z)
            ))
        }

        // Set life
        emitter.addInitialize(new this.Nebula.Life(config.life.min, config.life.max))

        // Set visual properties
        emitter.addBehaviour(new this.Nebula.Scale(config.size.start, config.size.end))
        emitter.addBehaviour(new this.Nebula.Color(
            config.color.start.r, config.color.start.g, config.color.start.b,
            config.color.end.r, config.color.end.g, config.color.end.b
        ))
        emitter.addBehaviour(new this.Nebula.Alpha(config.color.start.a, config.color.end.a))

        // Add physics
        if (config.gravity) {
            emitter.addBehaviour(new this.Nebula.Force(config.gravity.x, config.gravity.y, config.gravity.z))
        }
        if (config.acceleration) {
            emitter.addBehaviour(new this.Nebula.Force(config.acceleration.x, config.acceleration.y, config.acceleration.z))
        }

        // Set rendering
        await this.setupRenderer(emitter, config, presetName)

        // Set emission rate
        if (config.emissionRate) {
            // Constant emission
            emitter.setRate(new this.Nebula.Rate(
                new this.Nebula.Span(config.emissionRate, config.emissionRate),
                new this.Nebula.Span(0.1, 0.1)
            ))
        } else if (config.burstCount) {
            // Burst emission
            emitter.setRate(new this.Nebula.Rate(
                new this.Nebula.Span(config.burstCount, config.burstCount),
                new this.Nebula.Span(0.01, 0.01)
            ))
        }

        // Add position spread if specified
        if (config.positionSpread) {
            emitter.addInitialize(new this.Nebula.Position(
                new this.Nebula.Span(-config.positionSpread.x, config.positionSpread.x),
                new this.Nebula.Span(-config.positionSpread.y, config.positionSpread.y),
                new this.Nebula.Span(-config.positionSpread.z, config.positionSpread.z)
            ))
        }

        this.particleSystems.set(id, emitter)
        this.nebulaSystem.addEmitter(emitter)

        return emitter
    }

    /**
     * Setup the renderer based on config
     */
    private async setupRenderer(emitter: any, config: ParticleSystemConfig, presetName?: string): Promise<void> {
        if (!this.Nebula) return

        let texture: Texture

        switch (config.renderType) {
            case 'sprite':
                if (config.texture) {
                    texture = await this.loadTexture(config.texture)
                } else {
                    // Choose texture based on preset name
                    if (presetName?.includes('muzzle') || presetName?.includes('flash') || presetName?.includes('spark')) {
                        texture = this.sparkTexture
                    } else {
                        texture = this.smokeTexture
                    }
                }
                emitter.addInitialize(new this.Nebula.Body(new this.Nebula.BodySprite(texture)))
                break

            case 'spritesheet':
                if (config.texture && config.spriteSheetConfig) {
                    texture = await this.loadTexture(config.texture)
                    // Note: three-nebula doesn't have built-in spritesheet support
                    // This would need custom implementation or using multiple textures
                    emitter.addInitialize(new this.Nebula.Body(new this.Nebula.BodySprite(texture)))
                } else {
                    texture = this.smokeTexture
                    emitter.addInitialize(new this.Nebula.Body(new this.Nebula.BodySprite(texture)))
                }
                break

            case 'shape':
            default:
                emitter.addInitialize(new this.Nebula.Body(new this.Nebula.BodySprite(this.shapeTexture)))
                break
        }
    }

    /**
     * Create a particle effect at a specific position using a preset
     */
    createEffect(
        presetName: string, 
        position: Vector3, 
        entityId?: number
    ): string {
        if (!this.Nebula) {
            console.warn('Nebula not initialized yet, cannot create effect')
            return ''
        }

        const config = PARTICLE_PRESETS[presetName]
        if (!config) {
            console.warn(`Particle preset '${presetName}' not found`)
            return ''
        }

        const systemId = `${presetName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Create particle entity
        let particleEntity: Entity
        if (entityId) {
            particleEntity = this.world.getEntity(entityId)!
        } else {
            particleEntity = this.world.createEntity()
        }

        // Add particle component
        const particleComp: ParticleComponent = {
            type: 'particle',
            systemId,
            emissionType: config.emissionRate ? 'constant' : 'burst',
            isActive: true,
            autoRemove: config.autoRemove
        }
        particleEntity.addComponent(particleComp)

        // Add position component if not exists
        if (!particleEntity.hasComponent('position')) {
            const positionComp: PositionComponent = {
                type: 'position',
                x: position.x,
                y: position.y,
                z: position.z,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0
            }
            particleEntity.addComponent(positionComp)
        }

        // Create the actual particle system
        this.createParticleSystem(systemId, config, position, presetName).then((emitter) => {
            if (emitter) {
                emitter.emit()
            }
        })

        return systemId
    }

    /**
     * Create gun smoke effect at a position
     */
    createGunSmoke(position: Vector3, direction?: Vector3): string {
        const config = { ...PARTICLE_PRESETS.gunSmoke }
        
        // Adjust velocity based on direction if provided
        if (direction) {
            config.velocity = direction.clone().multiplyScalar(2).add(new Vector3(0, 1, 0))
        }

        return this.createEffect('gunSmoke', position)
    }

    /**
     * Create muzzle flash effect
     */
    createMuzzleFlash(position: Vector3, direction?: Vector3): string {
        const config = { ...PARTICLE_PRESETS.muzzleFlash }
        
        if (direction) {
            config.velocity = direction.clone().multiplyScalar(3)
        }

        return this.createEffect('muzzleFlash', position)
    }

    /**
     * Stop a particle system
     */
    stopParticleSystem(systemId: string): void {
        const emitter = this.particleSystems.get(systemId)
        if (emitter) {
            emitter.stopEmit()
        }
    }

    /**
     * Remove a particle system completely
     */
    removeParticleSystem(systemId: string): void {
        const emitter = this.particleSystems.get(systemId)
        if (emitter) {
            emitter.destroy()
            this.nebulaSystem.removeEmitter(emitter)
            this.particleSystems.delete(systemId)
        }
    }

    update(deltaTime: number): void {
        // Update the nebula system
        this.nebulaSystem.update(deltaTime)

        // Check for systems that should be removed
        const entities = this.getEntities()
        for (const entity of entities) {
            const particle = entity.getComponent<ParticleComponent>('particle')
            if (!particle) continue

            const emitter = this.particleSystems.get(particle.systemId)
            if (emitter && particle.autoRemove) {
                // Check if emitter is dead (no particles left)
                if (emitter.particles.length === 0 && !emitter.isEmitting) {
                    this.removeParticleSystem(particle.systemId)
                    this.world.removeEntity(entity.id)
                }
            }
        }
    }

    /**
     * Clean up all particle systems
     */
    destroy(): void {
        for (const [systemId, emitter] of this.particleSystems) {
            emitter.destroy()
        }
        this.particleSystems.clear()
        this.nebulaSystem.destroy()
    }
}
