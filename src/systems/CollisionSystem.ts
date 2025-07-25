import { Mesh, Vector3 } from 'three'
import { getParticleConfig } from '../config/ParticlesConfig'
import type {
    CollisionComponent,
    DamageableComponent,
    HealthComponent,
    PositionComponent,
    ProjectileComponent,
    RenderableComponent,
    SpawnBarrelComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { AudioSystem } from './AudioSystem'
import type { DeathAnimationSystem } from './DeathAnimationSystem'
import type { ParticleSystem } from './ParticleSystem'

export class CollisionSystem extends System {
    private audioSystem: AudioSystem | null = null
    private particleSystem: ParticleSystem | null = null
    private deathAnimationSystem: DeathAnimationSystem | null = null

    constructor(world: World) {
        super(world, []) // We'll manually query for different component combinations
    }

    /**
     * Set the audio system reference for playing collision sounds
     */
    setAudioSystem(audioSystem: AudioSystem): void {
        this.audioSystem = audioSystem
    }

    setParticleSystem(particleSystem: ParticleSystem): void {
        this.particleSystem = particleSystem
    }

    setDeathAnimationSystem(deathAnimationSystem: DeathAnimationSystem): void {
        this.deathAnimationSystem = deathAnimationSystem
    }

    update(_deltaTime: number): void {
        const projectiles = this.world.getEntitiesWithComponents([
            'projectile',
            'position',
        ])
        const damageableEntities = this.world.getEntitiesWithComponents([
            'damageable',
            'health',
            'position',
            'collision',
        ])

        const projectilesToRemove: number[] = []

        for (const projectile of projectiles) {
            const projectileComp =
                projectile.getComponent<ProjectileComponent>('projectile')
            const projectilePos =
                projectile.getComponent<PositionComponent>('position')

            if (!projectileComp || !projectilePos) continue

            for (const target of damageableEntities) {
                // IMPORTANT: Prevent self-damage - skip if target is the owner of the projectile
                // This ensures ships don't damage themselves with their own projectiles
                if (target.id === projectileComp.ownerId) continue

                const targetPos =
                    target.getComponent<PositionComponent>('position')
                const targetHealth =
                    target.getComponent<HealthComponent>('health')
                const targetDamageable =
                    target.getComponent<DamageableComponent>('damageable')
                const targetCollision =
                    target.getComponent<CollisionComponent>('collision')

                if (
                    !targetPos ||
                    !targetHealth ||
                    !targetDamageable ||
                    !targetCollision
                )
                    continue
                if (targetHealth.isDead) continue

                // Check collision using configurable collision shapes
                if (
                    this.checkCollision(
                        projectilePos,
                        targetPos,
                        targetCollision,
                    )
                ) {
                    // Apply damage
                    this.applyDamage(targetHealth, projectileComp.damage)

                    // Play wreckage particle effect
                    this.playWreckageParticleEffect(projectilePos)

                    // Play hit sound effect
                    this.playHitSound()

                    // Mark projectile for removal
                    if (!projectilesToRemove.includes(projectile.id)) {
                        projectilesToRemove.push(projectile.id)
                    }

                    // Check if target died
                    if (targetHealth.currentHealth <= 0) {
                        targetHealth.isDead = true

                        // Remove alive component - entity is now dead
                        if (target.hasComponent('alive')) {
                            target.removeComponent('alive')
                        }

                        target.addComponent<SpawnBarrelComponent>({
                            type: 'spawnBarrel',
                        })

                        // Play death/explosion sound
                        this.playDeathSound()

                        // Start death animation for enemies and players
                        if (this.deathAnimationSystem) {
                            this.deathAnimationSystem.startDeathAnimation(
                                target,
                            )
                        }
                    }

                    break // Projectile can only hit one target
                }
            }
        }

        // Remove projectiles that hit targets
        for (const projectileId of projectilesToRemove) {
            this.removeProjectile(projectileId)
        }
    }

    private checkCollision(
        projectilePos: PositionComponent,
        targetPos: PositionComponent,
        targetCollision: CollisionComponent,
    ): boolean {
        // Apply offset if specified
        const offsetX = targetCollision.offset?.x || 0
        const offsetY = targetCollision.offset?.y || 0
        const offsetZ = targetCollision.offset?.z || 0

        const targetX = targetPos.x + offsetX
        const targetY = targetPos.y + offsetY
        const targetZ = targetPos.z + offsetZ

        if (targetCollision.collider.shape === 'sphere') {
            // Sphere collision
            const radius = targetCollision.collider.radius
            const dx = projectilePos.x - targetX
            const dy = projectilePos.y - targetY
            const dz = projectilePos.z - targetZ
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

            return distance <= radius
        } else {
            // Box collision
            const halfWidth = targetCollision.collider.width / 2
            const halfHeight = targetCollision.collider.height / 2
            const halfDepth = targetCollision.collider.depth / 2

            const dx = Math.abs(projectilePos.x - targetX)
            const dy = Math.abs(projectilePos.y - targetY)
            const dz = Math.abs(projectilePos.z - targetZ)

            return dx <= halfWidth && dy <= halfHeight && dz <= halfDepth
        }
    }

    private applyDamage(health: HealthComponent, damage: number): void {
        health.currentHealth = Math.max(0, health.currentHealth - damage)
    }

    private playWreckageParticleEffect(position: PositionComponent): void {
        if (!this.particleSystem) {
            return
        }

        const wreckageId = `wreckage_${position.x}_${position.y}_${position.z}`
        const wreckageConfig = getParticleConfig(
            'wreckage',
            new Vector3(position.x, position.y, position.z),
            new Vector3(0, 1, 0),
        )
        this.particleSystem.createAndBurstParticleSystem(
            wreckageId,
            wreckageConfig,
        )
    }

    private removeProjectile(projectileId: number): void {
        const entity = this.world.getEntity(projectileId)
        if (entity) {
            // Dispose of the mesh if it exists
            const renderable =
                entity.getComponent<RenderableComponent>('renderable')
            if (renderable?.mesh) {
                // Remove from scene (assuming parent is handling this)
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
            this.world.removeEntity(projectileId)
        }
    }

    /**
     * Play hit sound effect - using death sound for now since no separate hit sound available
     */
    private playHitSound(): void {
        if (!this.audioSystem) return

        // Use death sound for hits since no separate hit sound is available
        this.audioSystem.playSfx('death', { volume: 0.5 })
    }

    /**
     * Play death/explosion sound effect
     */
    private playDeathSound(): void {
        if (!this.audioSystem) return

        // Use the death sound for all death events
        this.audioSystem.playSfx('death')
    }
}
