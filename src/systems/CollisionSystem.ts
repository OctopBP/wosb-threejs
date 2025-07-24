import { Box3, Mesh, Sphere, Vector3 } from 'three'
import { getParticleConfig } from '../config/ParticlesConfig'
import type {
    CollisionComponent,
    DamageableComponent,
    HealthComponent,
    ModelCollider,
    PositionComponent,
    ProjectileComponent,
    RenderableComponent,
    SpawnBarrelComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import { getCollisionModelClone } from '../ModelPreloader'
import type { AudioSystem } from './AudioSystem'
import type { DeathAnimationSystem } from './DeathAnimationSystem'
import type { ParticleSystem } from './ParticleSystem'

interface ModelCollisionCache {
    boundingBox: Box3
    boundingSphere: Sphere
    geometry?: Mesh[]
}

export class CollisionSystem extends System {
    private audioSystem: AudioSystem | null = null
    private particleSystem: ParticleSystem | null = null
    private deathAnimationSystem: DeathAnimationSystem | null = null
    private modelCollisionCache: Map<string, ModelCollisionCache> = new Map()

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

                        // Start death animation for enemies (not player)
                        if (
                            target.hasComponent('enemy') &&
                            this.deathAnimationSystem
                        ) {
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
        } else if (targetCollision.collider.shape === 'box') {
            // Box collision
            const halfWidth = targetCollision.collider.width / 2
            const halfHeight = targetCollision.collider.height / 2
            const halfDepth = targetCollision.collider.depth / 2

            const dx = Math.abs(projectilePos.x - targetX)
            const dy = Math.abs(projectilePos.y - targetY)
            const dz = Math.abs(projectilePos.z - targetZ)

            return dx <= halfWidth && dy <= halfHeight && dz <= halfDepth
        } else if (targetCollision.collider.shape === 'model') {
            // Model collision
            return this.checkModelCollision(
                projectilePos,
                targetPos,
                targetCollision.collider,
                targetCollision.offset,
            )
        }

        return false
    }

    private checkModelCollision(
        projectilePos: PositionComponent,
        targetPos: PositionComponent,
        modelCollider: ModelCollider,
        offset?: { x: number; y: number; z: number },
    ): boolean {
        const collisionData = this.getModelCollisionData(modelCollider)
        if (!collisionData) return false

        // Apply offset if specified
        const offsetX = offset?.x || 0
        const offsetY = offset?.y || 0
        const offsetZ = offset?.z || 0

        const targetPosition = new Vector3(
            targetPos.x + offsetX,
            targetPos.y + offsetY,
            targetPos.z + offsetZ,
        )
        const projectilePosition = new Vector3(
            projectilePos.x,
            projectilePos.y,
            projectilePos.z,
        )

        switch (modelCollider.precision) {
            case 'boundingBox': {
                const boundingBox = collisionData.boundingBox.clone()
                boundingBox.translate(targetPosition)
                return boundingBox.containsPoint(projectilePosition)
            }

            case 'boundingSphere': {
                const boundingSphere = collisionData.boundingSphere.clone()
                boundingSphere.center.add(targetPosition)
                return boundingSphere.containsPoint(projectilePosition)
            }

            case 'geometry': {
                if (!collisionData.geometry) return false

                // For geometry-based collision, we'll use a more complex approach
                // This is a simplified version - for production you might want to use
                // a more sophisticated collision detection library like cannon.js
                for (const mesh of collisionData.geometry) {
                    const meshBoundingBox = new Box3().setFromObject(mesh)
                    meshBoundingBox.translate(targetPosition)
                    if (meshBoundingBox.containsPoint(projectilePosition)) {
                        return true
                    }
                }
                return false
            }

            default:
                return false
        }
    }

    private getModelCollisionData(
        modelCollider: ModelCollider,
    ): ModelCollisionCache | null {
        const cacheKey = `${modelCollider.modelType}_${modelCollider.scale || 1}`

        if (this.modelCollisionCache.has(cacheKey)) {
            return this.modelCollisionCache.get(cacheKey)!
        }

        // Load model and compute collision data
        const model = getCollisionModelClone(modelCollider.modelType)
        if (!model) return null

        const collisionData: ModelCollisionCache = {
            boundingBox: new Box3(),
            boundingSphere: new Sphere(),
        }

        // Apply scale if specified
        if (modelCollider.scale) {
            model.scale.setScalar(modelCollider.scale)
        }

        // Compute bounding box and sphere
        collisionData.boundingBox.setFromObject(model)
        collisionData.boundingBox.getBoundingSphere(
            collisionData.boundingSphere,
        )

        // For geometry precision, collect all mesh objects
        if (modelCollider.precision === 'geometry') {
            const meshes: Mesh[] = []
            model.traverse((child) => {
                if (child instanceof Mesh) {
                    meshes.push(child)
                }
            })
            collisionData.geometry = meshes
        }

        this.modelCollisionCache.set(cacheKey, collisionData)
        return collisionData
    }

    /**
     * Clear the model collision cache (useful for memory management)
     */
    clearModelCollisionCache(): void {
        this.modelCollisionCache.clear()
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
