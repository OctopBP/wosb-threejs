import { Color, Mesh, ShaderMaterial, Vector3 } from 'three'
import { getParticleConfig } from '../config/ParticlesConfig'
import type {
    DeathAnimationComponent,
    HealthComponent,
    PositionComponent,
    RenderableComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import dissolveFragmentShader from '../shaders/dissolve.frag?raw'
import dissolveVertexShader from '../shaders/dissolve.vert?raw'
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

            if (!deathAnimation || !position || !health) {
                continue
            }

            // Only animate dead entities
            if (!health.isDead) {
                continue
            }

            // Update animation time
            deathAnimation.currentTime += deltaTime

            // Trigger explosion effects at the beginning of death animation
            if (!deathAnimation.wreckageTriggered) {
                this.triggerExplosionEffects(position)
                deathAnimation.wreckageTriggered = true
            }

            // Calculate sinking progress (0 to 1)
            const progress = Math.min(
                deathAnimation.currentTime / deathAnimation.sinkDuration,
                1,
            )

            // Apply dissolve shader at the beginning of death animation (when mesh is available)
            if (!deathAnimation.dissolveShaderApplied) {
                const renderable =
                    entity.getComponent<RenderableComponent>('renderable')

                if (renderable?.mesh && renderable.mesh instanceof Mesh) {
                    this.applyDissolveShader(entity)
                    deathAnimation.dissolveShaderApplied = true
                } else {
                    // If it's been too long waiting for mesh (more than 0.5 seconds), give up on dissolve effect
                    if (deathAnimation.currentTime > 0.5) {
                        deathAnimation.dissolveShaderApplied = true // Mark as applied to stop trying
                    }
                }
                // If mesh doesn't exist yet, we'll try again next frame
            }

            // Update dissolve shader uniforms (only if shader is applied)
            if (deathAnimation.dissolveShaderApplied) {
                this.updateDissolveShader(entity, progress)
            }

            // Apply sinking animation - gradually move ship underwater
            position.y =
                deathAnimation.originalY -
                (1 - (1 - progress) ** 0.4) * deathAnimation.sinkSpeed

            // Add dramatic rotation during sinking for flooding effect
            position.rotationX = progress * 1.5 // Forward tilt as it floods and sinks
            position.rotationZ = Math.sin(progress * Math.PI * 3) * 0.2 // Rolling motion as water enters
            // Optional: slight yaw rotation for more chaos
            position.rotationY += deltaTime * 0.3 * progress // Slow spin as it sinks

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

    private triggerExplosionEffects(position: PositionComponent): void {
        if (!this.particleSystem) return

        const explosionPosition = new Vector3(
            position.x,
            position.y + 0.5,
            position.z,
        )
        const timestamp = Date.now()
        const randomId = Math.random()

        // Stage 1: Nuclear explosion (immediate, intense core blast)
        const nukeId = `nuke_explosion_${timestamp}_${randomId}`
        const nukeConfig = getParticleConfig(
            'nukeExplosion',
            explosionPosition.clone(),
            new Vector3(0, 1, 0),
        )
        this.particleSystem.createAndBurstParticleSystem(nukeId, nukeConfig)

        // Stage 2: Big explosion flames (50ms delay, main blast)
        setTimeout(() => {
            if (!this.particleSystem) return
            const bigExplosionId = `big_explosion_${timestamp}_${randomId}`
            const bigExplosionConfig = getParticleConfig(
                'bigExplosion',
                explosionPosition.clone(),
                new Vector3(0, 1, 0),
            )
            this.particleSystem.createAndBurstParticleSystem(
                bigExplosionId,
                bigExplosionConfig,
            )
        }, 50)

        // Stage 3: Small explosion flames (150ms delay, secondary bursts)
        setTimeout(() => {
            if (!this.particleSystem) return
            const smallExplosionId = `small_explosion_${timestamp}_${randomId}`
            const smallExplosionConfig = getParticleConfig(
                'smallExplosion',
                explosionPosition.clone(),
                new Vector3(0, 1, 0),
            )
            this.particleSystem.createAndBurstParticleSystem(
                smallExplosionId,
                smallExplosionConfig,
            )
        }, 150)

        // Stage 4: Explosion smoke (300ms delay, lingering aftermath)
        setTimeout(() => {
            if (!this.particleSystem) return
            const smokeId = `explosion_smoke_${timestamp}_${randomId}`
            const smokeConfig = getParticleConfig(
                'explosionSmoke',
                explosionPosition.clone(),
                new Vector3(0, 1, 0),
            )
            this.particleSystem.createAndBurstParticleSystem(
                smokeId,
                smokeConfig,
            )
        }, 300)

        // Stage 5: Wreckage particles (400ms delay, debris)
        setTimeout(() => {
            if (!this.particleSystem) return
            const wreckageId = `wreckage_death_${timestamp}_${randomId}`
            const wreckageConfig = getParticleConfig(
                'deathWreckage',
                explosionPosition.clone(),
                new Vector3(0, 1, 0),
            )
            this.particleSystem.createAndBurstParticleSystem(
                wreckageId,
                wreckageConfig,
            )
        }, 400)
    }

    private applyDissolveShader(entity: Entity): void {
        const renderable =
            entity.getComponent<RenderableComponent>('renderable')

        if (!renderable?.mesh || !(renderable.mesh instanceof Mesh)) {
            return
        }

        const deathAnimation =
            entity.getComponent<DeathAnimationComponent>('deathAnimation')
        if (!deathAnimation) {
            return
        }

        // Store original material for cleanup
        deathAnimation.originalMaterial = renderable.mesh.material

        // Create dissolve shader material
        const dissolveMaterial = new ShaderMaterial({
            vertexShader: dissolveVertexShader,
            fragmentShader: dissolveFragmentShader,
            uniforms: {
                uDissolveAmount: { value: 0.0 },
                uEdgeWidth: { value: 0.1 },
                uEdgeColor: { value: new Color(0xff6600) }, // Orange glow
                uBaseColor: { value: new Color(0x8b4513) }, // Brown ship color
                uOpacity: { value: 1.0 },
                uTime: { value: 0.0 },
            },
            transparent: true,
            alphaTest: 0.1,
        })

        // Apply the dissolve material
        renderable.mesh.material = dissolveMaterial
        console.log(
            'DeathAnimationSystem: Dissolve shader applied successfully',
        )
    }

    private updateDissolveShader(entity: Entity, progress: number): void {
        const renderable =
            entity.getComponent<RenderableComponent>('renderable')
        if (!renderable?.mesh || !(renderable.mesh instanceof Mesh)) return

        const material = renderable.mesh.material
        if (!(material instanceof ShaderMaterial) || !material.uniforms) return

        // Update shader uniforms based on animation progress
        const currentTime = performance.now() / 1000

        // Dissolve starts halfway through the animation and completes at the end
        const dissolveProgress = Math.max(0, (progress - 0.3) / 0.7)

        material.uniforms.uDissolveAmount.value = dissolveProgress
        material.uniforms.uTime.value = currentTime
        material.uniforms.uOpacity.value = 1.0 - progress * 0.5 // Gradual opacity reduction
    }

    private removeDeadEntity(entityId: number): void {
        const entity = this.world.getEntity(entityId)
        if (!entity) return

        // Clean up dissolve shader if applied
        const deathAnimation =
            entity.getComponent<DeathAnimationComponent>('deathAnimation')
        const renderable =
            entity.getComponent<RenderableComponent>('renderable')

        if (
            deathAnimation?.dissolveShaderApplied &&
            renderable?.mesh instanceof Mesh
        ) {
            // Dispose of the dissolve shader material
            if (renderable.mesh.material instanceof ShaderMaterial) {
                renderable.mesh.material.dispose()
            }

            // Restore original material if it exists (for proper cleanup)
            if (deathAnimation.originalMaterial) {
                renderable.mesh.material = deathAnimation.originalMaterial
            }
        }

        // Clean up mesh if it exists
        if (renderable?.mesh) {
            // Remove from scene
            if (renderable.mesh.parent) {
                renderable.mesh.parent.remove(renderable.mesh)
            }

            // Dispose geometry and materials if it's a Mesh
            if (renderable.mesh instanceof Mesh) {
                if (renderable.mesh.geometry) {
                    renderable.mesh.geometry.dispose()
                }
                if (renderable.mesh.material) {
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
        entity: Entity,
        sinkSpeed = 15.0,
        sinkDuration = 4.0,
    ): void {
        const position = entity.getComponent<PositionComponent>('position')
        if (!position) {
            return
        }

        // Add death animation component
        const deathAnimation: DeathAnimationComponent = {
            type: 'deathAnimation',
            sinkSpeed,
            originalY: position.y,
            sinkDuration,
            currentTime: 0,
            wreckageTriggered: false,
            dissolveShaderApplied: false,
            originalMaterial: undefined,
        }

        entity.addComponent(deathAnimation)
    }
}
