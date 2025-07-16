import type { GameStateConfig } from '../../config/GameStateConfig'
import type { GameStateComponent } from '../../ecs/Component'
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
        levelingSystem: import('../LevelingSystem').LevelingSystem | null,
    ): string | null
}

export abstract class BaseGameState implements GameStateHandler {
    abstract handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
        levelingSystem: import('../LevelingSystem').LevelingSystem | null,
    ): string | null

    protected getPlayerEntity(
        world: World,
    ): import('../../ecs/Entity').Entity | null {
        const playerEntities = world.getEntitiesWithComponents(['player'])
        return playerEntities.length > 0 ? playerEntities[0] : null
    }

    protected getPlayerPosition(
        world: World,
    ): import('../../ecs/Component').PositionComponent | null {
        const player = this.getPlayerEntity(world)
        if (!player) return null
        return (
            player.getComponent<
                import('../../ecs/Component').PositionComponent
            >('position') || null
        )
    }

    protected getAliveEnemies(
        world: World,
        excludeBoss: boolean = false,
    ): import('../../ecs/Entity').Entity[] {
        const currentEnemies = world.getEntitiesWithComponents([
            'enemy',
            'health',
        ])
        return currentEnemies.filter((enemy) => {
            const health =
                enemy.getComponent<
                    import('../../ecs/Component').HealthComponent
                >('health')
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

        // Use provided distance or default from config
        const distance = spawnDistance || config.wave1.spawnDistance

        // Choose spawn position
        let spawnX: number, spawnZ: number

        if (config.spawning.spawnAngleRandomness) {
            // Random angle around player
            const spawnAngle = Math.random() * 2 * Math.PI
            spawnX = playerPosition.x + Math.cos(spawnAngle) * distance
            spawnZ = playerPosition.z + Math.sin(spawnAngle) * distance
        } else {
            // Fixed position in front of player
            spawnX = playerPosition.x
            spawnZ = playerPosition.z + distance
        }

        // Create enemy ship
        const enemy = createEnemyShip(
            spawnX,
            config.spawning.spawnHeightOffset,
            spawnZ,
            player.id,
        )

        // Add enemy to world
        world.addEntity(enemy)
    }

    protected spawnBoss(world: World, config: GameStateConfig): void {
        const playerPosition = this.getPlayerPosition(world)
        if (!playerPosition) return

        const player = this.getPlayerEntity(world)
        if (!player) return

        // Spawn boss in front of player
        const spawnX = playerPosition.x
        const spawnZ = playerPosition.z + config.boss.spawnDistance

        // Create boss ship
        const boss = createBossShip(
            spawnX,
            config.spawning.spawnHeightOffset,
            spawnZ,
            player.id,
        )

        // Add boss to world
        world.addEntity(boss)
    }
}
