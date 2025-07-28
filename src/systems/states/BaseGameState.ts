import { isPositionInAnyAllowedArea } from '../../config/EnemyConfig'
import type { GameStateConfig } from '../../config/GameStateConfig'
import { getRandomSpawnDistanceForWaveOrBoss } from '../../config/GameStateConfig'
import type {
    GameStateComponent,
    HealthComponent,
    PositionComponent,
} from '../../ecs/Component'
import type { Entity } from '../../ecs/Entity'
import type { World } from '../../ecs/World'
import { createBossShip, createEnemyShip } from '../../entities/EnemyFactory'
export interface GameStateHandler {
    /**
     * Handle the current state logic
     * @param gameState The current game state component
     * @param config Configuration for this state
     * @param world The ECS world
     * @param levelingSystem Reference to the leveling system for XP awarding
     * @returns Next state to transition to, or null to stay in current state
     */
    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
    ): string | null
}

export abstract class BaseGameState implements GameStateHandler {
    abstract handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
    ): string | null

    protected getPlayerEntity(world: World): Entity | null {
        const playerEntities = world.getEntitiesWithComponents(['player'])
        return playerEntities.length > 0 ? playerEntities[0] : null
    }

    protected getPlayerPosition(world: World): PositionComponent | null {
        const player = this.getPlayerEntity(world)
        if (!player) {
            return null
        }

        return player.getComponent<PositionComponent>('position') || null
    }

    protected getAliveEnemies(
        world: World,
        excludeBoss: boolean = false,
    ): Entity[] {
        const currentEnemies = world.getEntitiesWithComponents([
            'enemy',
            'health',
        ])
        return currentEnemies.filter((enemy) => {
            const health = enemy.getComponent<HealthComponent>('health')
            if (!health || health.isDead) return false

            if (excludeBoss && enemy.hasComponent('boss')) return false

            return true
        })
    }

    protected spawnEnemyAroundPlayer(
        world: World,
        config: GameStateConfig,
        spawnDistance?: number,
    ): void {
        const playerPosition = this.getPlayerPosition(world)
        if (!playerPosition) return

        const player = this.getPlayerEntity(world)
        if (!player) return

        // Use allowed areas from main config
        const areas = config.allowedAreas

        // Use provided distance or random from config
        const distance =
            spawnDistance || getRandomSpawnDistanceForWaveOrBoss(config.wave1)

        // Try to find a valid spawn position within allowed areas
        const maxAttempts = 50 // Prevent infinite loops
        let attempts = 0
        let spawnX: number, spawnZ: number

        do {
            // Random angle around player
            const spawnAngle = Math.random() * 2 * Math.PI
            spawnX = playerPosition.x + Math.cos(spawnAngle) * distance
            spawnZ = playerPosition.z + Math.sin(spawnAngle) * distance
            attempts++

            // Check if position is in any allowed area
            if (isPositionInAnyAllowedArea(spawnX, spawnZ, areas)) {
                break
            }

            // If we've tried many times, try with a different distance
            if (attempts % 10 === 0 && attempts < maxAttempts) {
                // Reduce distance to try closer to player
                const newDistance = distance * (0.7 + Math.random() * 0.3)
                spawnX =
                    playerPosition.x +
                    Math.cos(Math.random() * 2 * Math.PI) * newDistance
                spawnZ =
                    playerPosition.z +
                    Math.sin(Math.random() * 2 * Math.PI) * newDistance
            }
        } while (
            attempts < maxAttempts &&
            !isPositionInAnyAllowedArea(spawnX, spawnZ, areas)
        )

        // If we couldn't find a valid position after many attempts, log warning and spawn anyway
        if (attempts >= maxAttempts) {
            console.warn(
                `⚠️ Could not find valid spawn position within allowed areas after ${maxAttempts} attempts. Spawning at last attempted position.`,
            )
        }

        // Create enemy ship
        const enemy = createEnemyShip(
            spawnX,
            spawnZ,
            playerPosition.x,
            playerPosition.z,
        )

        // Add enemy to world
        world.addEntity(enemy)

        if (attempts < maxAttempts) {
            console.log(
                `🎯 Enemy spawned at (${spawnX.toFixed(1)}, ${spawnZ.toFixed(1)}) within allowed area after ${attempts} attempts`,
            )
        }
    }

    protected spawnBoss(world: World, config: GameStateConfig): void {
        const playerPosition = this.getPlayerPosition(world)
        if (!playerPosition) return

        const player = this.getPlayerEntity(world)
        if (!player) return

        // Use allowed areas from main config
        const areas = config.allowedAreas

        // Try to find a valid spawn position for boss within allowed areas
        const maxAttempts = 50
        let attempts = 0
        let spawnX: number, spawnZ: number

        do {
            // Spawn boss in front of player with random distance
            const distance = getRandomSpawnDistanceForWaveOrBoss(config.boss)
            const spawnAngle = Math.random() * 2 * Math.PI // Random angle instead of just front
            spawnX = playerPosition.x + Math.cos(spawnAngle) * distance
            spawnZ = playerPosition.z + Math.sin(spawnAngle) * distance
            attempts++

            // Check if position is in any allowed area
            if (isPositionInAnyAllowedArea(spawnX, spawnZ, areas)) {
                break
            }
        } while (attempts < maxAttempts)

        // If we couldn't find a valid position, log warning and spawn anyway
        if (attempts >= maxAttempts) {
            console.warn(
                `⚠️ Could not find valid boss spawn position within allowed areas after ${maxAttempts} attempts. Spawning at last attempted position.`,
            )
        }

        // Create boss ship
        const boss = createBossShip(
            spawnX,
            spawnZ,
            playerPosition.x,
            playerPosition.z,
        )

        // Add boss to world
        world.addEntity(boss)

        if (attempts < maxAttempts) {
            console.log(
                `👹 Boss spawned at (${spawnX.toFixed(1)}, ${spawnZ.toFixed(1)}) within allowed area after ${attempts} attempts`,
            )
        }
    }
}
