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
    VelocityComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
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
        // Handle projectile-to-damageable collisions
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

        // Handle ship-to-static object collisions
        const ships = this.world.getEntitiesWithComponents([
            'position',
            'collision',
            'velocity',
        ])
        const staticObjects = this.world
            .getEntitiesWithComponents(['position', 'collision', 'renderable'])
            .filter((entity) => {
                // Islands and other static objects don't have velocity or damageable components
                return (
                    !entity.hasComponent('velocity') &&
                    !entity.hasComponent('damageable')
                )
            })

        const projectilesToRemove: number[] = []

        // Check ship-to-static object collisions first and resolve them
        this.handleShipStaticCollisions(ships, staticObjects)

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

    /**
     * Handle collisions between ships and static objects (like islands)
     * Prevents ships from moving through static objects by adjusting their positions
     */
    private handleShipStaticCollisions(
        ships: Entity[],
        staticObjects: Entity[],
    ): void {
        for (const ship of ships) {
            const shipPos = ship.getComponent<PositionComponent>('position')
            const shipCollision =
                ship.getComponent<CollisionComponent>('collision')
            const shipVelocity =
                ship.getComponent<VelocityComponent>('velocity')

            if (!shipPos || !shipCollision || !shipVelocity) continue

            for (const staticObj of staticObjects) {
                const staticPos =
                    staticObj.getComponent<PositionComponent>('position')
                const staticCollision =
                    staticObj.getComponent<CollisionComponent>('collision')

                if (!staticPos || !staticCollision) continue

                // Check if ship and static object are colliding
                if (
                    this.checkEntityCollision(
                        shipPos,
                        shipCollision,
                        staticPos,
                        staticCollision,
                    )
                ) {
                    // Resolve collision by moving ship away from static object
                    this.resolveShipStaticCollision(
                        shipPos,
                        shipCollision,
                        staticPos,
                        staticCollision,
                    )

                    // Stop ship movement to prevent getting stuck
                    shipVelocity.dx *= 0.1
                    shipVelocity.dz *= 0.1
                }
            }
        }
    }

    /**
     * Check collision between two entities with collision components
     */
    private checkEntityCollision(
        pos1: PositionComponent,
        collision1: CollisionComponent,
        pos2: PositionComponent,
        collision2: CollisionComponent,
    ): boolean {
        // Apply offsets
        const offset1X = collision1.offset?.x || 0
        const offset1Y = collision1.offset?.y || 0
        const offset1Z = collision1.offset?.z || 0

        const offset2X = collision2.offset?.x || 0
        const offset2Y = collision2.offset?.y || 0
        const offset2Z = collision2.offset?.z || 0

        const x1 = pos1.x + offset1X
        const y1 = pos1.y + offset1Y
        const z1 = pos1.z + offset1Z

        const x2 = pos2.x + offset2X
        const y2 = pos2.y + offset2Y
        const z2 = pos2.z + offset2Z

        // Box-to-box collision (most common case for ships and islands)
        if (
            collision1.collider.shape === 'box' &&
            collision2.collider.shape === 'box'
        ) {
            const halfWidth1 = collision1.collider.width / 2
            const halfHeight1 = collision1.collider.height / 2
            const halfDepth1 = collision1.collider.depth / 2

            const halfWidth2 = collision2.collider.width / 2
            const halfHeight2 = collision2.collider.height / 2
            const halfDepth2 = collision2.collider.depth / 2

            return (
                Math.abs(x1 - x2) < halfWidth1 + halfWidth2 &&
                Math.abs(y1 - y2) < halfHeight1 + halfHeight2 &&
                Math.abs(z1 - z2) < halfDepth1 + halfDepth2
            )
        }

        // For now, just handle box-to-box collisions
        // Can be extended for sphere-to-box, sphere-to-sphere, etc.
        return false
    }

    /**
     * Resolve collision by moving ship away from static object
     */
    private resolveShipStaticCollision(
        shipPos: PositionComponent,
        shipCollision: CollisionComponent,
        staticPos: PositionComponent,
        staticCollision: CollisionComponent,
    ): void {
        // Calculate the direction to push the ship away from the static object
        const dx = shipPos.x - staticPos.x
        const dz = shipPos.z - staticPos.z

        // Calculate the minimum distance needed to separate the objects
        if (
            shipCollision.collider.shape === 'box' &&
            staticCollision.collider.shape === 'box'
        ) {
            const shipHalfWidth = shipCollision.collider.width / 2
            const shipHalfDepth = shipCollision.collider.depth / 2
            const staticHalfWidth = staticCollision.collider.width / 2
            const staticHalfDepth = staticCollision.collider.depth / 2

            const minSeparationX = shipHalfWidth + staticHalfWidth
            const minSeparationZ = shipHalfDepth + staticHalfDepth

            // Determine which axis has the smallest overlap and resolve along that axis
            const overlapX = minSeparationX - Math.abs(dx)
            const overlapZ = minSeparationZ - Math.abs(dz)

            if (overlapX < overlapZ) {
                // Resolve along X axis
                const pushDirection = dx >= 0 ? 1 : -1
                shipPos.x = staticPos.x + pushDirection * minSeparationX
            } else {
                // Resolve along Z axis
                const pushDirection = dz >= 0 ? 1 : -1
                shipPos.z = staticPos.z + pushDirection * minSeparationZ
            }
        }
    }
}
