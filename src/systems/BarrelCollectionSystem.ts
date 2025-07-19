import { Mesh } from 'three'
import type {
    CollectableComponent,
    PositionComponent,
    RenderableComponent,
    XPBarrelComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { LevelingSystem } from './LevelingSystem'

export class BarrelCollectionSystem extends System {
    private levelingSystem: LevelingSystem | null = null

    constructor(world: World) {
        super(world, ['xpBarrel', 'collectable', 'position'])
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

            if (!xpBarrel || !collectable || !barrelPosition) continue

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

            // Update floating animation
            this.updateFloatingAnimation(barrel, deltaTime)

            // Check if player is in collection range
            if (
                this.isPlayerInRange(
                    playerPosition,
                    barrelPosition,
                    xpBarrel.collectionRange,
                )
            ) {
                this.collectBarrel(barrel, player)
            }
        }

        // Clean up collected barrels
        this.cleanupCollectedBarrels()
    }

    private isPlayerInRange(
        playerPos: PositionComponent,
        barrelPos: PositionComponent,
        range: number,
    ): boolean {
        const dx = playerPos.x - barrelPos.x
        const dy = playerPos.y - barrelPos.y
        const dz = playerPos.z - barrelPos.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
        return distance <= range
    }

    private updateFloatingAnimation(barrel: Entity, deltaTime: number): void {
        const xpBarrel = barrel.getComponent<XPBarrelComponent>('xpBarrel')
        const position = barrel.getComponent<PositionComponent>('position')

        if (!xpBarrel || !position) return

        // Update floating height using sine wave
        const currentTime = Date.now() / 1000
        const floatOffset =
            Math.sin((currentTime - xpBarrel.spawnTime) * xpBarrel.floatSpeed) *
            0.2
        position.y = xpBarrel.floatHeight + floatOffset

        // Gentle rotation for visual appeal
        position.rotationY += deltaTime * 0.5
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
