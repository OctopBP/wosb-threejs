import type { Scene, Vector3 } from 'three'
import {
    System as NebulaSystem,
    Rate,
    Span,
    Position,
    Mass,
    Radius,
    Life,
    RandomDrift,
    Rotate,
    Scale,
    Alpha,
    Color as NebulaColor,
    SpriteRenderer,
    Emitter,
    SphereZone,
    PointZone,
} from 'three-nebula'
import type { ParticleSystemConfig } from '../config/ParticleConfig'
import { getParticleConfig } from '../config/ParticleConfig'
import type {
    ParticleComponent,
    PositionComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class ParticleSystem extends System {
    private scene: Scene
    private nebulaSystem: NebulaSystem
    private entityEmitters: Map<number, Emitter> = new Map()

    constructor(world: World, scene: Scene) {
        super(world, ['position', 'particle'])
        this.scene = scene
        
        // Initialize the three-nebula system
        this.nebulaSystem = new NebulaSystem()
        this.nebulaSystem.addRenderer(new SpriteRenderer(scene, 'three'))
    }

    update(_deltaTime: number): void {
        // Update the nebula system
        this.nebulaSystem.update()

        const entities = this.getEntities()
        const currentTime = performance.now() / 1000

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const particle = entity.getComponent<ParticleComponent>('particle')

            if (!position || !particle) continue

            const entityId = entity.id
            
            // Check if particle should be auto-destroyed based on duration
            if (particle.duration && particle.startTime) {
                const elapsed = currentTime - particle.startTime
                if (elapsed >= particle.duration) {
                    if (particle.autoDestroy) {
                        this.destroyParticleEffect(entityId)
                        continue
                    } else {
                        // Just stop the emission but keep the entity
                        particle.active = false
                    }
                }
            }

            if (particle.active) {
                // Create or update emitter for this entity
                if (!this.entityEmitters.has(entityId)) {
                    this.createEmitterForEntity(entityId, particle, position)
                } else {
                    // Update emitter position
                    this.updateEmitterPosition(entityId, position)
                }
            } else {
                // Remove emitter if particle is inactive
                if (this.entityEmitters.has(entityId)) {
                    this.removeEmitterForEntity(entityId)
                }
            }
        }
    }

    private createEmitterForEntity(
        entityId: number,
        particle: ParticleComponent,
        position: PositionComponent
    ): void {
        const config = getParticleConfig(particle.systemType)
        const emitter = this.createSimpleEmitter(config, particle.intensity || 1.0)

        // Set emitter position
        emitter.position.set(position.x, position.y, position.z)

        // Start time tracking for duration
        if (config.duration && !particle.startTime) {
            particle.startTime = performance.now() / 1000
        }

        // Add emitter to system and tracking
        this.nebulaSystem.addEmitter(emitter)
        this.entityEmitters.set(entityId, emitter)

        // Start emission
        emitter.emit()
    }

    private updateEmitterPosition(
        entityId: number,
        position: PositionComponent
    ): void {
        const emitter = this.entityEmitters.get(entityId)
        if (emitter) {
            emitter.position.set(position.x, position.y, position.z)
        }
    }

    private removeEmitterForEntity(entityId: number): void {
        const emitter = this.entityEmitters.get(entityId)
        if (emitter) {
            emitter.stopEmit()
            this.nebulaSystem.removeEmitter(emitter)
            this.entityEmitters.delete(entityId)
        }
    }

    private createSimpleEmitter(config: ParticleSystemConfig, intensity: number = 1.0): Emitter {
        const emitter = new Emitter()

        // Set emission rate
        const rate = new Rate(
            new Span(config.emissionRate * intensity, config.emissionRate * intensity + 10), 
            new Span(0.1, 0.3)
        )
        emitter.setRate(rate)

        // Add basic initializers
        emitter.addInitializer(new Mass(1))
        emitter.addInitializer(new Radius(config.size.min, config.size.max))
        emitter.addInitializer(new Life(config.lifetime.min, config.lifetime.max))
        emitter.addInitializer(new Position(new PointZone(0, 0, 0)))

        // Add basic behaviors
        emitter.addBehaviour(new Scale(config.scale.start, config.scale.end))
        emitter.addBehaviour(new Alpha(config.alpha.start, config.alpha.end))

        // Add movement if specified
        if (config.velocity) {
            emitter.addBehaviour(new RandomDrift(
                config.velocity.min * intensity, 
                config.velocity.max * intensity, 
                config.velocity.min * intensity, 
                0.2
            ))
        }

        // Add rotation if specified
        if (config.rotation) {
            emitter.addBehaviour(new Rotate('random', 'random'))
        }

        // Set duration if specified
        if (config.duration) {
            emitter.setTotalEmitTimes(1)
            emitter.setLife(config.duration)
        }

        return emitter
    }

    private destroyParticleEffect(entityId: number): void {
        // Remove emitter
        this.removeEmitterForEntity(entityId)
        
        // Find and remove entity from world
        const entity = this.world.getEntity(entityId)
        if (entity) {
            this.world.removeEntity(entity.id)
        }
    }

    // Public methods for creating particle effects
    public createExplosion(position: Vector3, intensity: number = 1.0): void {
        this.createOneTimeEffect('explosion', position, intensity)
    }

    public createImpact(position: Vector3, intensity: number = 1.0): void {
        this.createOneTimeEffect('impact', position, intensity)
    }

    public createMuzzleFlash(position: Vector3, intensity: number = 1.0): void {
        this.createOneTimeEffect('muzzleFlash', position, intensity)
    }

    public createDamageEffect(position: Vector3, intensity: number = 1.0): void {
        this.createOneTimeEffect('damage', position, intensity)
    }

    public createDeathEffect(position: Vector3, intensity: number = 1.0): void {
        this.createOneTimeEffect('death', position, intensity)
    }

    private createOneTimeEffect(effectType: string, position: Vector3, intensity: number): void {
        const config = getParticleConfig(effectType)
        const emitter = this.createSimpleEmitter(config, intensity)
        
        emitter.position.set(position.x, position.y, position.z)
        
        this.nebulaSystem.addEmitter(emitter)
        emitter.emit()

        // Auto-remove after duration
        if (config.duration) {
            setTimeout(() => {
                emitter.stopEmit()
                this.nebulaSystem.removeEmitter(emitter)
            }, config.duration * 1000)
        }
    }

    cleanup(): void {
        // Stop all emitters
        for (const emitter of this.entityEmitters.values()) {
            emitter.stopEmit()
            this.nebulaSystem.removeEmitter(emitter)
        }
        this.entityEmitters.clear()

        // Destroy the nebula system
        this.nebulaSystem.destroy()
    }
}