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
    private debugHoming: boolean = false
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

    setHomingDebug(enabled: boolean): void {
        this.debugHoming = enabled
        if (enabled) {
            console.log('🎯 Homing projectile debug logging enabled')
        } else {
            console.log('🎯 Homing projectile debug logging disabled')
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
            if (currentTarget && currentTarget.hasComponent('alive')) {
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
            if (this.debugHoming) {
                console.log(
                    `🎯 Homing projectile acquired new target: ${newTarget.id}`,
                )
            }
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
        const target = this.world.getEntity(projectile.targetId!)
        if (!target) {
            projectile.targetId = null
            return
        }

        const targetPos = target.getComponent<PositionComponent>('position')
        if (!targetPos) {
            projectile.targetId = null
            return
        }

        // Calculate direction to target
        const dx = targetPos.x - projectilePos.x
        const dz = targetPos.z - projectilePos.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        if (distance === 0) return // Avoid division by zero

        // Normalize target direction
        const targetDirX = dx / distance
        const targetDirZ = dz / distance

        // Current velocity direction
        const currentSpeed = Math.sqrt(
            velocity.dx * velocity.dx + velocity.dz * velocity.dz,
        )
        if (currentSpeed === 0) return

        const currentDirX = velocity.dx / currentSpeed
        const currentDirZ = velocity.dz / currentSpeed

        // Calculate the angle between current direction and target direction
        const dot = currentDirX * targetDirX + currentDirZ * targetDirZ
        const cross = currentDirX * targetDirZ - currentDirZ * targetDirX
        const targetAngle = Math.atan2(cross, dot)

        // Apply turn rate limit
        const maxTurnThisFrame =
            (projectile.homingTurnRate || Math.PI * 1.5) * deltaTime
        const actualTurn =
            Math.sign(targetAngle) *
            Math.min(Math.abs(targetAngle), maxTurnThisFrame)

        // Apply homing strength
        const effectiveTurn = actualTurn * (projectile.homingStrength || 0.7)

        // Calculate new direction
        const currentAngle = Math.atan2(currentDirZ, currentDirX)
        const newAngle = currentAngle + effectiveTurn

        // Update velocity while maintaining speed
        velocity.dx = Math.cos(newAngle) * currentSpeed
        velocity.dz = Math.sin(newAngle) * currentSpeed

        // Update projectile rotation to face movement direction
        projectilePos.rotationY = Math.atan2(velocity.dx, velocity.dz)

        if (this.debugHoming && Math.abs(effectiveTurn) > 0.01) {
            console.log(
                `🎯 Homing projectile turning ${((effectiveTurn * 180) / Math.PI).toFixed(1)}° toward target`,
            )
        }
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
