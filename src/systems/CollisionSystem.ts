import type {
    DamageableComponent,
    HealthComponent,
    PositionComponent,
    ProjectileComponent,
    RenderableComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class CollisionSystem extends System {
    private readonly collisionRadius = 0.5 // Basic collision radius for projectiles

    constructor(world: World) {
        super(world, []) // We'll manually query for different component combinations
    }

    update(deltaTime: number): void {
        const projectiles = this.world.getEntitiesWithComponents([
            'projectile',
            'position',
        ])
        const damageableEntities = this.world.getEntitiesWithComponents([
            'damageable',
            'health',
            'position',
        ])

        const projectilesToRemove: number[] = []

        for (const projectile of projectiles) {
            const projectileComp =
                projectile.getComponent<ProjectileComponent>('projectile')
            const projectilePos =
                projectile.getComponent<PositionComponent>('position')

            if (!projectileComp || !projectilePos) continue

            for (const target of damageableEntities) {
                // Skip if target is the owner of the projectile
                if (target.id === projectileComp.ownerId) continue

                const targetPos =
                    target.getComponent<PositionComponent>('position')
                const targetHealth =
                    target.getComponent<HealthComponent>('health')
                const targetDamageable =
                    target.getComponent<DamageableComponent>('damageable')

                if (!targetPos || !targetHealth || !targetDamageable) continue
                if (targetHealth.isDead) continue

                // Check collision using simple distance check
                if (this.checkCollision(projectilePos, targetPos)) {
                    // Apply damage
                    this.applyDamage(targetHealth, projectileComp.damage)

                    // Mark projectile for removal
                    if (!projectilesToRemove.includes(projectile.id)) {
                        projectilesToRemove.push(projectile.id)
                    }

                    // Check if target died
                    if (targetHealth.currentHealth <= 0) {
                        targetHealth.isDead = true
                        // Could trigger death effects here in the future
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
    ): boolean {
        const dx = projectilePos.x - targetPos.x
        const dy = projectilePos.y - targetPos.y
        const dz = projectilePos.z - targetPos.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

        return distance <= this.collisionRadius
    }

    private applyDamage(health: HealthComponent, damage: number): void {
        health.currentHealth = Math.max(0, health.currentHealth - damage)
    }

    private removeProjectile(projectileId: number): void {
        const entity = this.world.getEntity(projectileId)
        if (entity) {
            // Dispose of the mesh if it exists
            const renderable =
                entity.getComponent<RenderableComponent>('renderable')
            if (renderable?.mesh) {
                renderable.mesh.dispose()
            }

            // Remove entity from world
            this.world.removeEntity(projectileId)
        }
    }
}
