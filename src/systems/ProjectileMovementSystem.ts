import { projectilePhysicsConfig } from '../config/WeaponConfig'
import type {
    PositionComponent,
    ProjectileComponent,
    VelocityComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class ProjectileMovementSystem extends System {
    constructor(world: World) {
        super(world, ['projectile', 'position', 'velocity'])
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const projectile =
                entity.getComponent<ProjectileComponent>('projectile')
            const position = entity.getComponent<PositionComponent>('position')
            const velocity = entity.getComponent<VelocityComponent>('velocity')

            if (!projectile || !position || !velocity) continue

            // Skip homing projectiles - they handle their own movement in HomingProjectileSystem
            if (entity.hasComponent('homingProjectile')) {
                // Still update position for homing projectiles, but skip gravity
                position.x += velocity.dx * deltaTime
                position.y += velocity.dy * deltaTime
                position.z += velocity.dz * deltaTime
                continue
            }

            // Apply gravity to velocity (creates arc trajectory) for non-homing projectiles
            velocity.dy += projectilePhysicsConfig.gravity * deltaTime

            // Update position based on velocity
            position.x += velocity.dx * deltaTime
            position.y += velocity.dy * deltaTime
            position.z += velocity.dz * deltaTime

            // Optional: Update rotation to face movement direction
            if (velocity.dx !== 0 || velocity.dz !== 0) {
                position.rotationY = Math.atan2(velocity.dx, velocity.dz)
            }
        }
    }
}
