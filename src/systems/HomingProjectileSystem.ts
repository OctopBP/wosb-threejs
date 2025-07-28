import type {
    EnemyComponent,
    HomingProjectileComponent,
    PlayerComponent,
    PositionComponent,
    ProjectileComponent,
    VelocityComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class HomingProjectileSystem extends System {
    private debugHoming: boolean = false

    constructor(world: World) {
        super(world, ['homingProjectile', 'projectile', 'position', 'velocity'])
    }

    setHomingDebug(enabled: boolean): void {
        this.debugHoming = enabled
        if (enabled) {
            console.log('🎯 Homing projectile debug logging enabled')
        } else {
            console.log('🎯 Homing projectile debug logging disabled')
        }
    }

    update(deltaTime: number): void {
        const currentTime = performance.now() / 1000
        const entities = this.getEntities()

        for (const entity of entities) {
            const homingComp =
                entity.getComponent<HomingProjectileComponent>(
                    'homingProjectile',
                )
            const projectileComp =
                entity.getComponent<ProjectileComponent>('projectile')
            const position = entity.getComponent<PositionComponent>('position')
            const velocity = entity.getComponent<VelocityComponent>('velocity')

            if (!homingComp || !projectileComp || !position || !velocity)
                continue

            // Check if we need to update target tracking
            const timeSinceLastUpdate = currentTime - homingComp.lastUpdateTime
            if (timeSinceLastUpdate >= homingComp.updateInterval) {
                this.updateTargetTracking(homingComp, position)
                homingComp.lastUpdateTime = currentTime
            }

            // Apply homing behavior if we have a target
            if (homingComp.targetId !== null) {
                this.applyHomingBehavior(
                    homingComp,
                    position,
                    velocity,
                    deltaTime,
                )
            }
        }
    }

    private updateTargetTracking(
        homingComp: HomingProjectileComponent,
        projectilePos: PositionComponent,
    ): void {
        // If we already have a target, check if it's still valid and in range
        if (homingComp.targetId !== null) {
            const currentTarget = this.world.getEntity(homingComp.targetId)
            if (currentTarget && currentTarget.hasComponent('alive')) {
                const targetPos =
                    currentTarget.getComponent<PositionComponent>('position')
                if (targetPos) {
                    const distance = this.calculateDistance(
                        projectilePos,
                        targetPos,
                    )
                    if (distance <= homingComp.homingRange) {
                        // Current target is still valid
                        return
                    }
                }
            }
            // Current target is invalid, clear it
            homingComp.targetId = null
        }

        // Find a new target
        const newTarget = this.findClosestTarget(projectilePos, homingComp)
        if (newTarget) {
            homingComp.targetId = newTarget.id
            if (this.debugHoming) {
                console.log(
                    `🎯 Homing projectile acquired new target: ${newTarget.id}`,
                )
            }
        }
    }

    private findClosestTarget(
        projectilePos: PositionComponent,
        homingComp: HomingProjectileComponent,
    ): Entity | null {
        const allEntities = this.world.getAllEntities()
        let closestTarget: Entity | null = null
        let closestDistance = Number.MAX_VALUE

        for (const entity of allEntities) {
            // Skip if entity doesn't have the required components
            if (
                !entity.hasComponent('position') ||
                !entity.hasComponent('alive')
            ) {
                continue
            }

            // Check if this entity is the correct target type
            const isValidTarget =
                (homingComp.targetType === 'player' &&
                    entity.hasComponent('player')) ||
                (homingComp.targetType === 'enemy' &&
                    entity.hasComponent('enemy'))

            if (!isValidTarget) continue

            const targetPos = entity.getComponent<PositionComponent>('position')
            if (!targetPos) continue

            const distance = this.calculateDistance(projectilePos, targetPos)

            if (
                distance <= homingComp.homingRange &&
                distance < closestDistance
            ) {
                closestDistance = distance
                closestTarget = entity
            }
        }

        return closestTarget
    }

    private applyHomingBehavior(
        homingComp: HomingProjectileComponent,
        projectilePos: PositionComponent,
        velocity: VelocityComponent,
        deltaTime: number,
    ): void {
        const target = this.world.getEntity(homingComp.targetId!)
        if (!target) {
            homingComp.targetId = null
            return
        }

        const targetPos = target.getComponent<PositionComponent>('position')
        if (!targetPos) {
            homingComp.targetId = null
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
        const maxTurnThisFrame = homingComp.maxTurnRate * deltaTime
        const actualTurn =
            Math.sign(targetAngle) *
            Math.min(Math.abs(targetAngle), maxTurnThisFrame)

        // Apply homing strength
        const effectiveTurn = actualTurn * homingComp.homingStrength

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
