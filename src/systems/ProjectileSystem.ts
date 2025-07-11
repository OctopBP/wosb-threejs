import { Mesh } from 'three'
import type {
    PositionComponent,
    ProjectileComponent,
    RenderableComponent,
    VelocityComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class ProjectileSystem extends System {
    constructor(world: World) {
        super(world, ['projectile', 'position', 'velocity'])
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()
        const entitiesToRemove: number[] = []

        for (const entity of entities) {
            const projectile =
                entity.getComponent<ProjectileComponent>('projectile')
            const position = entity.getComponent<PositionComponent>('position')
            const velocity = entity.getComponent<VelocityComponent>('velocity')

            if (!projectile || !position || !velocity) continue

            // Update projectile lifetime
            projectile.currentLifetime += deltaTime

            // Check if projectile has exceeded its lifetime
            if (projectile.currentLifetime >= projectile.maxLifetime) {
                entitiesToRemove.push(entity.id)
            }

            // Projectiles maintain constant velocity (no physics applied)
            // MovementSystem will handle the actual position updates
        }

        // Remove expired projectiles
        for (const entityId of entitiesToRemove) {
            this.removeProjectile(entityId)
        }
    }

    private removeProjectile(entityId: number): void {
        const entity = this.world.getEntity(entityId)
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
            this.world.removeEntity(entityId)
        }
    }
}
