import { Vector3 } from 'three'
import { getParticleConfig } from '../config/ParticlesConfig'
import type {
    DeathAnimationComponent,
    HealthComponent,
    PositionComponent,
    RenderableComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { ParticleSystem } from './ParticleSystem'

export class DeathAnimationSystem extends System {
    private particleSystem: ParticleSystem | null = null

    constructor(world: World) {
        super(world, ['deathAnimation', 'position', 'health'])
    }

    setParticleSystem(particleSystem: ParticleSystem): void {
        this.particleSystem = particleSystem
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()
        const entitiesToRemove: number[] = []

        for (const entity of entities) {
            const deathAnimation =
                entity.getComponent<DeathAnimationComponent>('deathAnimation')
            const position = entity.getComponent<PositionComponent>('position')
            const health = entity.getComponent<HealthComponent>('health')

            if (!deathAnimation || !position || !health) continue

            // Only animate dead entities
            if (!health.isDead) continue

            // Update animation time
            deathAnimation.currentTime += deltaTime

            // Trigger wreckage particles at the beginning of death animation
            if (!deathAnimation.wreckageTriggered) {
                this.triggerWreckageParticles(position)
                deathAnimation.wreckageTriggered = true
            }

            // Calculate sinking progress (0 to 1)
            const progress = Math.min(
                deathAnimation.currentTime / deathAnimation.sinkDuration,
                1,
            )

            // Apply sinking animation - gradually move ship underwater
            position.y =
                deathAnimation.originalY - progress * deathAnimation.sinkSpeed

            // Optional: Add slight rotation during sinking for more dramatic effect
            position.rotationX = progress * 0.3 // Slight forward tilt as it sinks
            position.rotationZ = Math.sin(progress * Math.PI * 2) * 0.1 // Slight rolling motion

            // Check if animation is complete
            if (progress >= 1.0) {
                entitiesToRemove.push(entity.id)
            }
        }

        // Remove entities that have completed their death animation
        for (const entityId of entitiesToRemove) {
            this.removeDeadEntity(entityId)
        }
    }

    private triggerWreckageParticles(position: PositionComponent): void {
        if (!this.particleSystem) return

        // Create dramatic wreckage particle effect at ship position
        const wreckageId = `wreckage_death_${Date.now()}_${Math.random()}`
        const wreckageConfig = getParticleConfig(
            'deathWreckage',
            new Vector3(position.x, position.y + 0.5, position.z), // Slightly above ship
            new Vector3(0, 1, 0), // Upward direction
        )

        this.particleSystem.createAndBurstParticleSystem(
            wreckageId,
            wreckageConfig,
        )
    }

    private removeDeadEntity(entityId: number): void {
        const entity = this.world.getEntity(entityId)
        if (!entity) return

        // Clean up mesh if it exists
        const renderable =
            entity.getComponent<RenderableComponent>('renderable')
        if (renderable?.mesh) {
            // Remove from scene
            if (renderable.mesh.parent) {
                renderable.mesh.parent.remove(renderable.mesh)
            }

            // Dispose geometry and materials if it's a Mesh
            if (renderable.mesh instanceof Object3D) {
                if ('geometry' in renderable.mesh && renderable.mesh.geometry) {
                    renderable.mesh.geometry.dispose()
                }
                if ('material' in renderable.mesh && renderable.mesh.material) {
                    if (Array.isArray(renderable.mesh.material)) {
                        for (const material of renderable.mesh.material) {
                            material.dispose()
                        }
                    } else {
                        renderable.mesh.material.dispose()
                    }
                }
            }

            renderable.mesh = undefined
        }

        // Remove entity from world
        this.world.removeEntity(entityId)
    }

    /**
     * Initialize death animation for a dead entity
     */
    public startDeathAnimation(
        entityId: number,
        sinkSpeed = 2.0,
        sinkDuration = 2.0,
    ): void {
        const entity = this.world.getEntity(entityId)
        if (!entity) return

        const position = entity.getComponent<PositionComponent>('position')
        if (!position) return

        // Add death animation component
        const deathAnimation: DeathAnimationComponent = {
            type: 'deathAnimation',
            sinkSpeed,
            originalY: position.y,
            sinkDuration,
            currentTime: 0,
            wreckageTriggered: false,
        }

        entity.addComponent(deathAnimation)
    }
}
