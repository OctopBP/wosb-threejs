import type { Scene } from 'three'
import { Vector3 } from 'three'
import { createBulletCollision } from '../config/CollisionConfig'
import { getParticleConfig } from '../config/ParticlesConfig'
import { projectilePhysicsConfig } from '../config/WeaponConfig'
import type {
    PositionComponent,
    ProjectileComponent,
    RenderableComponent,
    VelocityComponent,
    WeaponComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { AudioSystem } from './AudioSystem'
import type { ParticleSystem } from './ParticleSystem'

export class WeaponSystem extends System {
    private scene: Scene
    private debugAutoTargeting: boolean = false
    private audioSystem: AudioSystem | null = null
    private particleSystem: ParticleSystem | null = null

    constructor(world: World, scene: Scene) {
        super(world, ['weapon', 'position'])
        this.scene = scene
    }

    /**
     * Set the audio system reference for playing weapon sounds
     */
    setAudioSystem(audioSystem: AudioSystem): void {
        this.audioSystem = audioSystem
    }

    /**
     * Set the particle system reference for playing weapon particle effects
     */
    setParticleSystem(particleSystem: ParticleSystem): void {
        this.particleSystem = particleSystem
        // Note: We no longer pre-create particle systems, they are created per shot
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
        let closestTarget: Entity | null = null

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
    ): Entity | null {
        const targets = this.world.getEntitiesWithComponents([
            targetType,
            'position',
        ])
        let closestTarget: Entity | null = null
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

    private calculateDistance(
        pos1: PositionComponent,
        pos2: PositionComponent,
    ): number {
        const dx = pos2.x - pos1.x
        const dz = pos2.z - pos1.z
        return Math.sqrt(dx * dx + dz * dz)
    }

    /**
     * Find the closest shooting point to the target
     * Returns both the shooting point and its index
     */
    private findClosestShootingPoint(
        weapon: WeaponComponent,
        shooterPosition: PositionComponent,
        targetPosition: PositionComponent,
    ): { point: { x: number; y: number }, index: number } {
        if (!weapon.shootingPoints || weapon.shootingPoints.length === 0) {
            // Fallback to center of ship if no shooting points defined
            return { point: { x: 0, y: 0 }, index: 0 }
        }

        let closestPoint = weapon.shootingPoints[0]
        let closestIndex = 0
        let closestDistance = Number.MAX_VALUE

        for (let i = 0; i < weapon.shootingPoints.length; i++) {
            const point = weapon.shootingPoints[i]
            // Convert relative shooting point to world coordinates
            const rotation = -shooterPosition.rotationY
            const worldX =
                shooterPosition.x +
                (point.x * Math.cos(rotation) - point.y * Math.sin(rotation))
            const worldZ =
                shooterPosition.z +
                (point.x * Math.sin(rotation) + point.y * Math.cos(rotation))

            // Calculate distance from this shooting point to the target
            const dx = targetPosition.x - worldX
            const dz = targetPosition.z - worldZ
            const distance = Math.sqrt(dx * dx + dz * dz)

            if (distance < closestDistance) {
                closestDistance = distance
                closestPoint = point
                closestIndex = i
            }
        }

        return { point: closestPoint, index: closestIndex }
    }

    /**
     * Convert relative shooting point to world coordinates
     */
    private getWorldShootingPosition(
        shootingPoint: { x: number; y: number },
        shooterPosition: PositionComponent,
    ): { x: number; z: number } {
        // Apply rotation transformation to relative position
        const rotation = -shooterPosition.rotationY
        const worldX =
            shooterPosition.x +
            (shootingPoint.x * Math.cos(rotation) -
                shootingPoint.y * Math.sin(rotation))
        const worldZ =
            shooterPosition.z +
            (shootingPoint.x * Math.sin(rotation) +
                shootingPoint.y * Math.cos(rotation))

        return { x: worldX, z: worldZ }
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

        // Use first shooting point for manual aiming (or center if none defined)
        const shootingPointIndex = 0
        const shootingPoint =
            weapon.shootingPoints && weapon.shootingPoints.length > 0
                ? weapon.shootingPoints[shootingPointIndex]
                : { x: 0, y: 0 }

        // Get world position of the shooting point
        const worldShootingPos = this.getWorldShootingPosition(
            shootingPoint,
            shooterPosition,
        )

        // Position component - start slightly in front of and above shooting point
        const projectilePosition: PositionComponent = {
            type: 'position',
            x:
                worldShootingPos.x +
                forwardX * projectilePhysicsConfig.forwardOffset,
            y: shooterPosition.y + projectilePhysicsConfig.heightOffset,
            z:
                worldShootingPos.z +
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
            meshType: 'bullet', // Now properly supported
            visible: true,
            upgrades: {},
        }
        projectile.addComponent(renderable)

        // Collision component - sphere collider for bullet
        const collision = createBulletCollision()
        projectile.addComponent(collision)

        // Play weapon sound effect
        this.playWeaponSound()

        // Play weapon particle effects
        this.playWeaponParticleEffects(shooterId, shootingPointIndex, worldShootingPos, { x: forwardX, z: forwardZ })
    }

    private fireProjectileToTarget(
        shooterId: number,
        weapon: WeaponComponent,
        shooterPosition: PositionComponent,
        targetPosition: PositionComponent,
    ): void {
        // Create projectile entity
        const projectile = this.world.createEntity()

        // Find the closest shooting point to the target
        const { point: shootingPoint, index: shootingPointIndex } = this.findClosestShootingPoint(
            weapon,
            shooterPosition,
            targetPosition,
        )

        // Get world position of the chosen shooting point
        const worldShootingPos = this.getWorldShootingPosition(
            shootingPoint,
            shooterPosition,
        )

        // Calculate direction from shooting point to target
        const dx = targetPosition.x - worldShootingPos.x
        const dz = targetPosition.z - worldShootingPos.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        // Normalize direction
        const forwardX = dx / distance
        const forwardZ = dz / distance

        // Calculate target angle for projectile rotation (for visual purposes)
        const targetAngle = Math.atan2(forwardX, forwardZ)

        // Position component - start slightly in front of and above shooting point
        const projectilePosition: PositionComponent = {
            type: 'position',
            x:
                worldShootingPos.x +
                forwardX * projectilePhysicsConfig.forwardOffset,
            y: shooterPosition.y + projectilePhysicsConfig.heightOffset,
            z:
                worldShootingPos.z +
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
            meshType: 'bullet', // Now properly supported
            visible: true,
            upgrades: {},
        }
        projectile.addComponent(renderable)

        // Collision component - sphere collider for bullet
        const collision = createBulletCollision()
        projectile.addComponent(collision)

        // Play weapon sound effect
        this.playWeaponSound()

        // Play weapon particle effects
        this.playWeaponParticleEffects(shooterId, shootingPointIndex, worldShootingPos, { x: forwardX, z: forwardZ })
    }

    /**
     * Play weapon shooting sound
     */
    private playWeaponSound(): void {
        if (!this.audioSystem) return

        // Use the single shoot sound for all weapons
        this.audioSystem.playSfx('shoot')
    }

    /**
     * Play weapon particle effects at the shooting position
     * Creates unique particle systems for each shot to allow multiple simultaneous effects
     */
    private playWeaponParticleEffects(
        shooterId: number,
        shootingPointIndex: number,
        worldShootingPos: { x: number; z: number },
        direction: { x: number; z: number },
    ): void {
        if (!this.particleSystem) {
            return
        }

        const shootingPosition = new Vector3(
            worldShootingPos.x,
            0.5,
            worldShootingPos.z,
        )
        
        // Create direction vector (normalized)
        const shootingDirection = new Vector3(direction.x, 0, direction.z).normalize()

        // Generate unique IDs for this shot's particle systems
        // Include shooting point index to ensure different cannons don't conflict
        const timestamp = Date.now()
        const randomSuffix = Math.floor(Math.random() * 1000) // Add randomness for rapid fire
        const gunsmokeId = `gunsmoke_${shooterId}_${shootingPointIndex}_${timestamp}_${randomSuffix}`
        const muzzleFlashId = `muzzleflash_${shooterId}_${shootingPointIndex}_${timestamp}_${randomSuffix}`

        // Create gunsmoke particle system for this shot
        const gunsmokeConfig = getParticleConfig('gunsmoke', shootingPosition, shootingDirection)
        gunsmokeConfig.id = gunsmokeId
        this.particleSystem.createParticleSystem(gunsmokeConfig)
        this.particleSystem.burst(gunsmokeId)

        // Create muzzle flash particle system for this shot
        const muzzleFlashConfig = getParticleConfig('muzzleflash', shootingPosition, shootingDirection)
        muzzleFlashConfig.id = muzzleFlashId
        this.particleSystem.createParticleSystem(muzzleFlashConfig)
        this.particleSystem.burst(muzzleFlashId)

        // Schedule cleanup of these particle systems after their particles would have died
        // Gunsmoke lives 0.8-1.5 seconds, muzzle flash lives 0.05-0.15 seconds
        setTimeout(() => {
            this.particleSystem?.removeParticleSystem(gunsmokeId)
        }, 2000) // Clean up gunsmoke after 2 seconds

        setTimeout(() => {
            this.particleSystem?.removeParticleSystem(muzzleFlashId)
        }, 500) // Clean up muzzle flash after 0.5 seconds
    }
}
