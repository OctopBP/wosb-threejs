import { Mesh } from 'three'
import { enemySpawningConfig } from '../config/EnemyConfig'
import { enemyXPConfig } from '../config/LevelingConfig'
import type {
    HealthComponent,
    PositionComponent,
    RenderableComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import { createEnemyShip } from '../entities/EnemyFactory'
import type { LevelingSystem } from './LevelingSystem'

export class EnemySpawningSystem extends System {
    private lastSpawnTime: number = 0
    private spawnInterval: number = enemySpawningConfig.spawnInterval
    private maxEnemies: number = enemySpawningConfig.maxEnemies
    private spawnDistance: number = enemySpawningConfig.spawnDistance
    private levelingSystem: LevelingSystem | null = null

    constructor(world: World) {
        super(world, []) // No required components for spawning system
    }

    // Method to set the leveling system reference
    setLevelingSystem(levelingSystem: LevelingSystem): void {
        this.levelingSystem = levelingSystem
    }

    update(_deltaTime: number): void {
        const currentTime = performance.now() / 1000

        // Check if it's time to spawn a new enemy
        if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
            this.trySpawnEnemy()
            this.lastSpawnTime = currentTime
        }

        // Clean up dead enemies
        this.cleanupDeadEnemies()
    }

    private trySpawnEnemy(): void {
        // Check current enemy count
        const currentEnemies = this.world.getEntitiesWithComponents(['enemy'])
        if (currentEnemies.length >= this.maxEnemies) {
            return // Don't spawn if we've reached the limit
        }

        // Get player position for spawning reference
        const playerEntities = this.world.getEntitiesWithComponents(['player'])
        if (playerEntities.length === 0) {
            return // No player found
        }

        const player = playerEntities[0]
        const playerPosition =
            player.getComponent<PositionComponent>('position')
        if (!playerPosition) {
            return
        }

        // Choose a random spawn position around the player
        const spawnAngle = Math.random() * 2 * Math.PI
        const spawnX =
            playerPosition.x + Math.cos(spawnAngle) * this.spawnDistance
        const spawnZ =
            playerPosition.z + Math.sin(spawnAngle) * this.spawnDistance

        // Create enemy ship
        const enemy = createEnemyShip(
            spawnX,
            0.1, // Same Y level as player
            spawnZ,
            player.id, // Set player as target
        )

        // Add enemy to world
        this.world.addEntity(enemy)
    }

    private cleanupDeadEnemies(): void {
        const enemies = this.world.getEntitiesWithComponents([
            'enemy',
            'health',
        ])

        // Find newly dead enemies (dead but don't have death animation component yet)
        const newlyDeadEnemies = enemies.filter((enemy) => {
            const health = enemy.getComponent<HealthComponent>('health')
            const hasDeathAnimation = enemy.hasComponent('deathAnimation')
            return health?.isDead === true && !hasDeathAnimation
        })

        // Award XP for newly dead enemies
        if (newlyDeadEnemies.length > 0 && this.levelingSystem) {
            // Find the player entity to award XP to
            const playerEntities = this.world.getEntitiesWithComponents([
                'player',
            ])
            if (playerEntities.length > 0) {
                const player = playerEntities[0]

                for (const _ of newlyDeadEnemies) {
                    // Award XP for each enemy type (currently only basic enemies)
                    const xpAwarded = enemyXPConfig.basicEnemy
                    this.levelingSystem.awardXP(player.id, xpAwarded)
                    console.log(
                        `💀 Enemy defeated! Awarded ${xpAwarded} XP to player`,
                    )
                }
            }
        }

        // Note: Dead enemies are now handled by DeathAnimationSystem
        // They will be removed after their sinking animation completes
    }
}
