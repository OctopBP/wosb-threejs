import type { Scene } from 'three'
import { projectilePhysicsConfig } from '../config/WeaponConfig'
import type {
    PositionComponent,
    ProjectileComponent,
    RenderableComponent,
    VelocityComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class WeaponSystem extends System {
    private scene: Scene
    private debugAutoTargeting: boolean = false

    constructor(world: World, scene: Scene) {
        super(world, ['weapon', 'position'])
        this.scene = scene
    }

    // Method to enable/disable debug logging for auto-targeting weapons
    setAutoTargetingDebug(enabled: boolean): void {
        this.debugAutoTargeting = enabled
        if (enabled) {
            console.log('🎯 Auto-targeting weapon debug logging enabled')
        } else {
            console.log('🎯 Auto-targeting weapon debug logging disabled')
        }
    }

    update(_deltaTime: number): void {
        const currentTime = performance.now() / 1000 // Convert to seconds
        const entities = this.getEntities()

        for (const entity of entities) {
            const weapon = entity.getComponent<WeaponComponent>('weapon')
            const position = entity.getComponent<PositionComponent>('position')

            if (!weapon || !position) continue

            if (weapon.isAutoTargeting) {
                this.handleAutoTargetingWeapon(
                    entity.id,
                    weapon,
                    position,
                    currentTime,
                )
            } else {
                this.handleManualWeapon(
                    entity.id,
                    weapon,
                    position,
                    currentTime,
                )
            }
        }
    }

    private handleManualWeapon(
        entityId: number,
        weapon: WeaponComponent,
        position: PositionComponent,
        currentTime: number,
    ): void {
        // Original behavior: fire at regular intervals
        const timeSinceLastShot = currentTime - weapon.lastShotTime
        const fireInterval = 1 / weapon.fireRate

        if (timeSinceLastShot >= fireInterval) {
            this.fireProjectile(entityId, weapon, position)
            weapon.lastShotTime = currentTime
        }
    }

    private handleAutoTargetingWeapon(
        entityId: number,
        weapon: WeaponComponent,
        position: PositionComponent,
        currentTime: number,
    ): void {
        // Determine what type of entity this is and what it should target
        const entity = this.world.getEntity(entityId)
        if (!entity) return

        const isPlayer = entity.hasComponent('player')
        const isEnemy = entity.hasComponent('enemy')

        // Find the closest target based on what type of entity this is
        let closestTarget: import('../ecs/Entity').Entity | null = null

        if (isPlayer) {
            // Player targets enemies
            closestTarget = this.findClosestTarget(
                position,
                weapon.detectionRange,
                'enemy',
            )
        } else if (isEnemy) {
            // Enemy targets player
            closestTarget = this.findClosestTarget(
                position,
                weapon.detectionRange,
                'player',
            )
        }

        if (!closestTarget) {
            // No targets in range, don't fire
            if (this.debugAutoTargeting) {
                const entityType = isPlayer ? 'Player' : 'Enemy'
                const targetType = isPlayer ? 'enemies' : 'player'
                console.log(
                    `🎯 ${entityType} auto-targeting weapon: No ${targetType} in detection range, not firing`,
                )
            }
            return
        }

        // Calculate distance to target
        const targetPosition =
            closestTarget.getComponent<PositionComponent>('position')
        if (!targetPosition) return

        const distanceToTarget = this.calculateDistance(
            position,
            targetPosition,
        )

        // Check if target is within firing range
        if (distanceToTarget <= weapon.range) {
            // Check if enough time has passed since last shot
            const timeSinceLastShot = currentTime - weapon.lastShotTime
            const fireInterval = 1 / weapon.fireRate

            if (timeSinceLastShot >= fireInterval) {
                if (this.debugAutoTargeting) {
                    const entityType = isPlayer ? 'Player' : 'Enemy'
                    console.log(
                        `🎯 ${entityType} auto-targeting weapon: Firing at target ${distanceToTarget.toFixed(1)} units away`,
                    )
                }

                // Fire projectile toward the target
                this.fireProjectileToTarget(
                    entityId,
                    weapon,
                    position,
                    targetPosition,
                )
                weapon.lastShotTime = currentTime
            }
        } else {
            // Target detected but out of firing range
            if (this.debugAutoTargeting) {
                const entityType = isPlayer ? 'Player' : 'Enemy'
                console.log(
                    `🎯 ${entityType} auto-targeting weapon: Target detected but out of range (${distanceToTarget.toFixed(1)}/${weapon.range})`,
                )
            }
        }
    }

    private findClosestTarget(
        shooterPosition: PositionComponent,
        detectionRange: number,
        targetType: 'enemy' | 'player',
    ): import('../ecs/Entity').Entity | null {
        const targets = this.world.getEntitiesWithComponents([
            targetType,
            'position',
        ])
        let closestTarget: import('../ecs/Entity').Entity | null = null
        let closestDistance = Number.MAX_VALUE

        for (const target of targets) {
            const targetPosition =
                target.getComponent<PositionComponent>('position')
            if (!targetPosition) continue

            const distance = this.calculateDistance(
                shooterPosition,
                targetPosition,
            )

            if (distance <= detectionRange && distance < closestDistance) {
                closestDistance = distance
                closestTarget = target
            }
        }

        return closestTarget
    }

    // Legacy method for backward compatibility (now just calls the generic version)
    private findClosestEnemy(
        shooterPosition: PositionComponent,
        detectionRange: number,
    ): import('../ecs/Entity').Entity | null {
        return this.findClosestTarget(shooterPosition, detectionRange, 'enemy')
    }

    private calculateDistance(
        pos1: PositionComponent,
        pos2: PositionComponent,
    ): number {
        const dx = pos2.x - pos1.x
        const dz = pos2.z - pos1.z
        return Math.sqrt(dx * dx + dz * dz)
    }

    private fireProjectile(
        shooterId: number,
        weapon: WeaponComponent,
        shooterPosition: PositionComponent,
    ): void {
        // Create projectile entity
        const projectile = this.world.createEntity()

        // Calculate forward direction based on shooter's rotation
        const forwardX = Math.sin(shooterPosition.rotationY)
        const forwardZ = Math.cos(shooterPosition.rotationY)

        // Position component - start slightly in front of and above shooter
        const projectilePosition: PositionComponent = {
            type: 'position',
            x:
                shooterPosition.x +
                forwardX * projectilePhysicsConfig.forwardOffset,
            y: shooterPosition.y + projectilePhysicsConfig.heightOffset,
            z:
                shooterPosition.z +
                forwardZ * projectilePhysicsConfig.forwardOffset,
            rotationX: 0,
            rotationY: shooterPosition.rotationY,
            rotationZ: 0,
        }
        projectile.addComponent(projectilePosition)

        // Velocity component - projectile moves forward and slightly upward for arc
        const projectileVelocity: VelocityComponent = {
            type: 'velocity',
            dx: forwardX * weapon.projectileSpeed,
            dy: projectilePhysicsConfig.upwardVelocity, // Use configurable upward velocity
            dz: forwardZ * weapon.projectileSpeed,
            angularVelocityX: 0,
            angularVelocityY: 0,
            angularVelocityZ: 0,
        }
        projectile.addComponent(projectileVelocity)

        // Projectile component
        const projectileComp: ProjectileComponent = {
            type: 'projectile',
            damage: weapon.damage,
            speed: weapon.projectileSpeed,
            ownerId: shooterId,
            maxLifetime: weapon.range / weapon.projectileSpeed + 2.0, // Add extra time for arc trajectory
            currentLifetime: 0,
        }
        projectile.addComponent(projectileComp)

        // Renderable component - proper sphere mesh
        const renderable: RenderableComponent = {
            type: 'renderable',
            meshId: `projectile_${projectile.id}`,
            mesh: undefined, // Will be created by RenderSystem using primitive
            meshType: 'sphere', // Now properly supported
            visible: true,
        }
        projectile.addComponent(renderable)
    }

    private fireProjectileToTarget(
        shooterId: number,
        weapon: WeaponComponent,
        shooterPosition: PositionComponent,
        targetPosition: PositionComponent,
    ): void {
        // Create projectile entity
        const projectile = this.world.createEntity()

        // Calculate direction to target
        const dx = targetPosition.x - shooterPosition.x
        const dz = targetPosition.z - shooterPosition.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        // Normalize direction
        const forwardX = dx / distance
        const forwardZ = dz / distance

        // Calculate target angle for projectile rotation (for visual purposes)
        const targetAngle = Math.atan2(forwardX, forwardZ)

        // Position component - start slightly in front of and above shooter
        const projectilePosition: PositionComponent = {
            type: 'position',
            x:
                shooterPosition.x +
                forwardX * projectilePhysicsConfig.forwardOffset,
            y: shooterPosition.y + projectilePhysicsConfig.heightOffset,
            z:
                shooterPosition.z +
                forwardZ * projectilePhysicsConfig.forwardOffset,
            rotationX: 0,
            rotationY: targetAngle, // Point projectile toward target
            rotationZ: 0,
        }
        projectile.addComponent(projectilePosition)

        // Velocity component - projectile moves toward target and slightly upward for arc
        const projectileVelocity: VelocityComponent = {
            type: 'velocity',
            dx: forwardX * weapon.projectileSpeed,
            dy: projectilePhysicsConfig.upwardVelocity, // Use configurable upward velocity
            dz: forwardZ * weapon.projectileSpeed,
            angularVelocityX: 0,
            angularVelocityY: 0,
            angularVelocityZ: 0,
        }
        projectile.addComponent(projectileVelocity)

        // Projectile component
        const projectileComp: ProjectileComponent = {
            type: 'projectile',
            damage: weapon.damage,
            speed: weapon.projectileSpeed,
            ownerId: shooterId,
            maxLifetime: weapon.range / weapon.projectileSpeed + 2.0, // Add extra time for arc trajectory
            currentLifetime: 0,
        }
        projectile.addComponent(projectileComp)

        // Renderable component - proper sphere mesh
        const renderable: RenderableComponent = {
            type: 'renderable',
            meshId: `projectile_${projectile.id}`,
            mesh: undefined, // Will be created by RenderSystem using primitive
            meshType: 'sphere', // Now properly supported
            visible: true,
        }
        projectile.addComponent(renderable)
    }
}
