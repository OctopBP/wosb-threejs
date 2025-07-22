import { Mesh } from 'three'
import { defaultBarrelConfig } from '../config/BarrelConfig'
import type {
    BarrelAnimationState,
    CollectableComponent,
    PositionComponent,
    RenderableComponent,
    VelocityComponent,
    XPBarrelComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { LevelingSystem } from './LevelingSystem'

export class BarrelCollectionSystem extends System {
    private levelingSystem: LevelingSystem | null = null

    constructor(world: World) {
        super(world, ['xpBarrel', 'collectable', 'position', 'velocity'])
    }

    // Method to set the leveling system reference
    setLevelingSystem(levelingSystem: LevelingSystem): void {
        this.levelingSystem = levelingSystem
    }

    update(deltaTime: number): void {
        const currentTime = Date.now() / 1000
        const barrels = this.world.getEntitiesWithComponents([
            'xpBarrel',
            'collectable',
            'position',
            'velocity',
        ])
        const players = this.world.getEntitiesWithComponents([
            'player',
            'position',
        ])

        if (players.length === 0) return

        const player = players[0] // Assuming single player
        const playerPosition =
            player.getComponent<PositionComponent>('position')
        if (!playerPosition) return

        for (const barrel of barrels) {
            const xpBarrel = barrel.getComponent<XPBarrelComponent>('xpBarrel')
            const collectable =
                barrel.getComponent<CollectableComponent>('collectable')
            const barrelPosition =
                barrel.getComponent<PositionComponent>('position')
            const barrelVelocity =
                barrel.getComponent<VelocityComponent>('velocity')

            if (!xpBarrel || !collectable || !barrelPosition || !barrelVelocity)
                continue

            // Skip if already collected
            if (xpBarrel.isCollected) continue

            // Check if barrel has expired
            if (
                xpBarrel.lifespan > 0 &&
                currentTime - xpBarrel.spawnTime > xpBarrel.lifespan
            ) {
                this.removeBarrel(barrel)
                continue
            }

            // Handle animation states
            this.updateBarrelAnimation(barrel, deltaTime)

            // Handle attracting and floating states
            if (
                xpBarrel.animationState === 'floating' ||
                xpBarrel.animationState === 'attracting'
            ) {
                // Calculate distance to player
                const distanceToPlayer = this.getDistanceToPlayer(
                    playerPosition,
                    barrelPosition,
                )

                // For floating state, immediately transition to attracting and start lerping
                if (xpBarrel.animationState === 'floating') {
                    xpBarrel.animationState = 'attracting'
                    xpBarrel.isBeingAttracted = true
                }

                // Apply lerping movement toward player
                this.applyMagneticMovement(
                    barrel,
                    playerPosition,
                    barrelPosition,
                    barrelVelocity,
                    deltaTime,
                )

                // Check if close enough to collect
                if (distanceToPlayer <= 0.5) {
                    this.collectBarrel(barrel, player)
                }
            }
        }

        // Clean up collected barrels
        this.cleanupCollectedBarrels()
    }

    private getDistanceToPlayer(
        playerPos: PositionComponent,
        barrelPos: PositionComponent,
    ): number {
        const dx = playerPos.x - barrelPos.x
        const dy = playerPos.y - barrelPos.y
        const dz = playerPos.z - barrelPos.z
        return Math.sqrt(dx * dx + dy * dy + dz * dz)
    }

    private applyMagneticMovement(
        barrel: Entity,
        playerPos: PositionComponent,
        barrelPos: PositionComponent,
        barrelVelocity: VelocityComponent,
        deltaTime: number,
    ): void {
        const xpBarrel = barrel.getComponent<XPBarrelComponent>('xpBarrel')
        if (!xpBarrel) return

        // Calculate direction to player
        const dx = playerPos.x - barrelPos.x
        const dy = playerPos.y - barrelPos.y
        const dz = playerPos.z - barrelPos.z

        // Normalize direction
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (distance === 0) return

        const normalizedDx = dx / distance
        const normalizedDy = dy / distance
        const normalizedDz = dz / distance

        // Calculate movement speed
        const attractionSpeed = xpBarrel.attractionSpeed * deltaTime

        // Apply movement directly to position
        barrelPos.x += normalizedDx * attractionSpeed
        barrelPos.y += normalizedDy * attractionSpeed
        barrelPos.z += normalizedDz * attractionSpeed

        // Also update velocity for consistency (though not used for movement)
        barrelVelocity.dx = normalizedDx * xpBarrel.attractionSpeed
        barrelVelocity.dy = normalizedDy * xpBarrel.attractionSpeed
        barrelVelocity.dz = normalizedDz * xpBarrel.attractionSpeed
    }

    private updateBarrelAnimation(barrel: Entity, deltaTime: number): void {
        const xpBarrel = barrel.getComponent<XPBarrelComponent>('xpBarrel')
        const position = barrel.getComponent<PositionComponent>('position')
        const velocity = barrel.getComponent<VelocityComponent>('velocity')

        if (!xpBarrel || !position || !velocity) return

        switch (xpBarrel.animationState) {
            case 'flying':
                this.updateFlyingAnimation(
                    barrel,
                    position,
                    velocity,
                    deltaTime,
                )
                break
            case 'floating':
                // Just gentle drift, no special animation
                break
            case 'attracting':
                // Magnetic movement handled in main loop
                break
        }
    }

    private updateFlyingAnimation(
        barrel: Entity,
        position: PositionComponent,
        velocity: VelocityComponent,
        deltaTime: number,
    ): void {
        const xpBarrel = barrel.getComponent<XPBarrelComponent>('xpBarrel')
        if (!xpBarrel) return

        // Update flight progress
        xpBarrel.flightProgress += deltaTime / xpBarrel.flightTime

        if (xpBarrel.flightProgress >= 1.0) {
            // Flight complete, land at target position
            position.x = xpBarrel.targetPosition.x
            position.y = 0 // Water level
            position.z = xpBarrel.targetPosition.z

            // Stop movement
            velocity.dx = 0
            velocity.dy = 0
            velocity.dz = 0

            // Transition directly to attracting state to start lerping to player
            xpBarrel.animationState = 'attracting'
            xpBarrel.isBeingAttracted = true
            return
        }

        // Calculate arc trajectory position
        const progress = xpBarrel.flightProgress
        const easeOut = 1 - (1 - progress) ** 2 // Ease out for realistic trajectory

        // Linear interpolation for X and Z
        const startPos = xpBarrel.startPosition
        const targetPos = xpBarrel.targetPosition

        position.x = startPos.x + (targetPos.x - startPos.x) * easeOut
        position.z = startPos.z + (targetPos.z - startPos.z) * easeOut

        // Parabolic arc for Y (height)
        // Arc peaks at 50% progress
        const arcProgress = Math.sin(progress * Math.PI) // 0 to 1 to 0
        position.y = startPos.y + xpBarrel.arcHeight * arcProgress

        // Add spinning during flight for visual effect
        position.rotationX += deltaTime * defaultBarrelConfig.spinSpeedX
        position.rotationY += deltaTime * defaultBarrelConfig.spinSpeedY
        position.rotationZ += deltaTime * defaultBarrelConfig.spinSpeedZ
    }

    private collectBarrel(barrel: Entity, player: Entity): void {
        const xpBarrel = barrel.getComponent<XPBarrelComponent>('xpBarrel')
        const collectable =
            barrel.getComponent<CollectableComponent>('collectable')

        if (!xpBarrel || !collectable) return

        // Mark as collected
        xpBarrel.isCollected = true
        collectable.collectedBy.push(player.id)

        // Award XP to player
        if (this.levelingSystem) {
            this.levelingSystem.awardXP(player.id, xpBarrel.xpValue)
        }
    }

    private cleanupCollectedBarrels(): void {
        const collectedBarrels = this.world
            .getEntitiesWithComponents(['xpBarrel'])
            .filter((barrel) => {
                const xpBarrel =
                    barrel.getComponent<XPBarrelComponent>('xpBarrel')
                return xpBarrel?.isCollected === true
            })

        for (const barrel of collectedBarrels) {
            this.removeBarrel(barrel)
        }
    }

    private removeBarrel(barrel: Entity): void {
        // Clean up mesh if exists
        const renderable =
            barrel.getComponent<RenderableComponent>('renderable')
        if (renderable?.mesh) {
            // Remove from scene
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
        }

        // Remove entity from world
        this.world.removeEntity(barrel.id)
    }
}
