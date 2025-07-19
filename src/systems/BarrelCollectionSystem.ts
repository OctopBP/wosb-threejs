import { Mesh } from 'three'
import type {
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

            // Check if player is in collection range
            const distanceToPlayer = this.getDistanceToPlayer(
                playerPosition,
                barrelPosition,
            )

            if (distanceToPlayer <= xpBarrel.collectionRange) {
                if (!xpBarrel.isBeingAttracted) {
                    // Start magnetic attraction
                    xpBarrel.isBeingAttracted = true
                }

                // Apply magnetic movement toward player
                this.applyMagneticMovement(
                    barrel,
                    playerPosition,
                    barrelPosition,
                    barrelVelocity,
                    deltaTime,
                )

                // Check if close enough to collect (smaller distance than collection range)
                if (distanceToPlayer <= 1.0) {
                    this.collectBarrel(barrel, player)
                }
            } else {
                // Reset attraction if player moves out of range
                if (xpBarrel.isBeingAttracted) {
                    xpBarrel.isBeingAttracted = false
                    // Reset velocity to gentle drift
                    barrelVelocity.dx = (Math.random() - 0.5) * 0.2
                    barrelVelocity.dz = (Math.random() - 0.5) * 0.2
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

        // Apply magnetic velocity toward player
        const attractionForce = xpBarrel.attractionSpeed * deltaTime
        barrelVelocity.dx = normalizedDx * attractionForce
        barrelVelocity.dy = normalizedDy * attractionForce
        barrelVelocity.dz = normalizedDz * attractionForce
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
            console.log(
                `🪣 Barrel collected! Awarded ${xpBarrel.xpValue} XP to player`,
            )
        }

        // TODO: Play collection sound effect here when audio system is available
        // audioSystem.playSfx('barrel_collect')

        // TODO: Add collection particle effect here when VFX system is available
        // particleSystem.playEffect('barrel_collection', barrelPosition)
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
