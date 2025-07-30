import type { GameStateConfig } from '../../config/GameStateConfig'
import { getRandomSpawnDistanceForWaveOrBoss } from '../../config/GameStateConfig'
import { findValidSpawnPosition } from '../../config/SpawnZoneConfig'
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
     * @param gameWorld The GameWorld instance for accessing camera and other systems
     * @returns Next state to transition to, or null to stay in current state
     */
    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
        gameWorld: import('../../GameWorld').GameWorld,
    ): string | null
}

export abstract class BaseGameState implements GameStateHandler {
    abstract handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
        gameWorld: import('../../GameWorld').GameWorld,
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

        // Use provided distance or random from config
        const distance =
            spawnDistance || getRandomSpawnDistanceForWaveOrBoss(config.wave1)

        // Try to find a valid spawn position within spawn zones
        const validSpawnPosition = findValidSpawnPosition(
            playerPosition.x,
            playerPosition.z,
            distance,
            50, // max attempts
        )

        let spawnX: number
        let spawnZ: number

        if (validSpawnPosition) {
            // Use the valid spawn position found within spawn zones
            spawnX = validSpawnPosition.x
            spawnZ = validSpawnPosition.z
        } else {
            const spawnAngle = Math.random() * 2 * Math.PI
            spawnX = playerPosition.x + Math.cos(spawnAngle) * distance
            spawnZ = playerPosition.z + Math.sin(spawnAngle) * distance
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
    }

    protected spawnBoss(world: World, config: GameStateConfig): void {
        const playerPosition = this.getPlayerPosition(world)
        if (!playerPosition) return

        const player = this.getPlayerEntity(world)
        if (!player) return

        // Spawn boss in front of player with random distance
        const distance = getRandomSpawnDistanceForWaveOrBoss(config.boss)
        const spawnX = playerPosition.x
        const spawnZ = playerPosition.z + distance

        // Create boss ship
        const boss = createBossShip(
            spawnX,
            spawnZ,
            playerPosition.x,
            playerPosition.z,
        )

        // Add boss to world
        world.addEntity(boss)
    }
}
