import { projectilePhysicsConfig } from '../config/WeaponConfig'
import type {
    PositionComponent,
    ProjectileComponent,
    VelocityComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
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

            // Handle homing projectiles
            if (projectile.isHoming) {
                this.handleHomingProjectile(
                    projectile,
                    position,
                    velocity,
                    deltaTime,
                )
                // Update position for homing projectiles
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

    private handleHomingProjectile(
        projectile: ProjectileComponent,
        position: PositionComponent,
        velocity: VelocityComponent,
        deltaTime: number,
    ): void {
        const currentTime = performance.now() / 1000

        // Check if we need to update target tracking
        const timeSinceLastUpdate =
            currentTime - (projectile.lastHomingUpdate || 0)
        if (timeSinceLastUpdate >= (projectile.homingUpdateInterval || 0.1)) {
            this.updateTargetTracking(projectile, position)
            projectile.lastHomingUpdate = currentTime
        }

        // Apply homing behavior if we have a target
        if (projectile.targetId !== null && projectile.targetId !== undefined) {
            this.applyHomingBehavior(projectile, position, velocity, deltaTime)
        }
    }

    private updateTargetTracking(
        projectile: ProjectileComponent,
        projectilePos: PositionComponent,
    ): void {
        // If we already have a target, check if it's still valid and in range
        if (projectile.targetId !== null && projectile.targetId !== undefined) {
            const currentTarget = this.world.getEntity(projectile.targetId)
            if (currentTarget?.hasComponent('alive')) {
                const targetPos =
                    currentTarget.getComponent<PositionComponent>('position')
                if (targetPos) {
                    const distance = this.calculateDistance(
                        projectilePos,
                        targetPos,
                    )
                    if (distance <= (projectile.homingRange || 15.0)) {
                        // Current target is still valid
                        return
                    }
                }
            }
            // Current target is invalid, clear it
            projectile.targetId = null
        }

        // Find a new target (player for boss projectiles)
        const newTarget = this.findClosestPlayer(
            projectilePos,
            projectile.homingRange || 15.0,
        )
        if (newTarget) {
            projectile.targetId = newTarget.id
        }
    }

    private findClosestPlayer(
        projectilePos: PositionComponent,
        homingRange: number,
    ): Entity | null {
        const allEntities = this.world.getAllEntities()
        let closestTarget: Entity | null = null
        let closestDistance = Number.MAX_VALUE

        for (const entity of allEntities) {
            // Skip if entity doesn't have the required components
            if (
                !entity.hasComponent('position') ||
                !entity.hasComponent('alive') ||
                !entity.hasComponent('player')
            ) {
                continue
            }

            const targetPos = entity.getComponent<PositionComponent>('position')
            if (!targetPos) continue

            const distance = this.calculateDistance(projectilePos, targetPos)

            if (distance <= homingRange && distance < closestDistance) {
                closestDistance = distance
                closestTarget = entity
            }
        }

        return closestTarget
    }

    private applyHomingBehavior(
        projectile: ProjectileComponent,
        projectilePos: PositionComponent,
        velocity: VelocityComponent,
        deltaTime: number,
    ): void {
        if (!projectile.targetId) {
            return
        }

        const target = this.world.getEntity(projectile.targetId)
        if (!target) {
            projectile.targetId = null
            return
        }

        const targetPos = target.getComponent<PositionComponent>('position')
        if (!targetPos) {
            projectile.targetId = null
            return
        }

        // Calculate 3D direction to target
        const dirX = targetPos.x - projectilePos.x
        const dirY = targetPos.y - projectilePos.y
        const dirZ = targetPos.z - projectilePos.z
        const distance = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ)
        if (distance === 0) return // Avoid division by zero

        // Determine current speed magnitude (fallback to projectile.speed)
        let currentSpeed = Math.sqrt(
            velocity.dx * velocity.dx +
                velocity.dy * velocity.dy +
                velocity.dz * velocity.dz,
        )
        if (currentSpeed === 0) {
            currentSpeed = projectile.speed
        }

        // Normalize direction and set velocity directly toward target
        const normX = dirX / distance
        const normY = dirY / distance
        const normZ = dirZ / distance
        velocity.dx = normX * currentSpeed
        velocity.dy = normY * currentSpeed
        velocity.dz = normZ * currentSpeed

        // Update projectile rotation to face movement direction (XZ plane)
        projectilePos.rotationY = Math.atan2(velocity.dx, velocity.dz)
    }

    private calculateDistance(
        pos1: PositionComponent,
        pos2: PositionComponent,
    ): number {
        const dx = pos1.x - pos2.x
        const dz = pos1.z - pos2.z
        return Math.sqrt(dx * dx + dz * dz)
    }
}
