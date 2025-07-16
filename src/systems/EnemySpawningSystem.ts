import { Mesh } from 'three'
import { BossComponent } from '../components/BossComponent'
import type { GameStateComponent } from '../components/GameStateComponent'
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
import { GameState } from '../types/GameState'

export class EnemySpawningSystem extends System {
    private lastSpawnTime: number = 0
    private spawnInterval: number = enemySpawningConfig.spawnInterval
    private maxEnemies: number = enemySpawningConfig.maxEnemies
    private spawnDistance: number = enemySpawningConfig.spawnDistance
    private levelingSystem: import('./LevelingSystem').LevelingSystem | null =
        null
    private gameStateSystem:
        | import('./GameStateSystem').GameStateSystem
        | null = null

    constructor(world: World) {
        super(world, []) // No required components for spawning system
    }

    // Method to set the leveling system reference
    setLevelingSystem(
        levelingSystem: import('./LevelingSystem').LevelingSystem,
    ): void {
        this.levelingSystem = levelingSystem
    }

    // Method to set the game state system reference
    setGameStateSystem(
        gameStateSystem: import('./GameStateSystem').GameStateSystem,
    ): void {
        this.gameStateSystem = gameStateSystem
    }

    update(_deltaTime: number): void {
        const currentTime = performance.now() / 1000

        // Only spawn if we have a game state system and are not in NEW_SHIP_OFFER state
        if (!this.gameStateSystem) {
            return
        }

        const currentState = this.gameStateSystem.getCurrentState()
        if (currentState === GameState.NEW_SHIP_OFFER) {
            return
        }

        // Check if it's time to spawn a new enemy
        if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
            this.trySpawnEnemy()
            this.lastSpawnTime = currentTime
        }

        // Clean up dead enemies
        this.cleanupDeadEnemies()
    }

    private trySpawnEnemy(): void {
        if (!this.gameStateSystem) return

        const currentState = this.gameStateSystem.getCurrentState()
        const gameStateComponent = this.gameStateSystem.getGameStateComponent()

        // Check if we should spawn based on current game state
        if (!this.shouldSpawnInCurrentState(currentState, gameStateComponent)) {
            return
        }

        // Check current enemy count
        const currentEnemies = this.world.getEntitiesWithComponents(['enemy'])
        const stateMaxEnemies = this.getMaxEnemiesForState(currentState)
        if (currentEnemies.length >= stateMaxEnemies) {
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

        // Create enemy based on current state
        const enemy = this.createEnemyForState(
            currentState,
            spawnX,
            0.1, // Same Y level as player
            spawnZ,
            player.id.toString(),
        )

        // Add enemy to world
        this.world.addEntity(enemy)

        // Update game state counters
        this.updateSpawnCounters(currentState, gameStateComponent)
    }

    private shouldSpawnInCurrentState(
        state: GameState,
        gameStateComponent: GameStateComponent,
    ): boolean {
        switch (state) {
            case GameState.WAVE_1:
                return gameStateComponent.data.wave1EnemiesSpawned < 5
            case GameState.WAVE_2:
                return gameStateComponent.data.wave2EnemiesSpawned < 10
            case GameState.BOSS_FIGHT:
                return !gameStateComponent.data.bossSpawned
            default:
                return false
        }
    }

    private getMaxEnemiesForState(state: GameState): number {
        switch (state) {
            case GameState.WAVE_1:
                return 5
            case GameState.WAVE_2:
                return 10
            case GameState.BOSS_FIGHT:
                return 1
            default:
                return 0
        }
    }

    private createEnemyForState(
        state: GameState,
        x: number,
        y: number,
        z: number,
        playerId: string,
    ): any {
        const enemy = createEnemyShip(x, y, z, parseInt(playerId))

        if (state === GameState.BOSS_FIGHT) {
            // Add boss component
            const bossComponent = new BossComponent()
            enemy.addComponent(bossComponent)

            // Modify health for boss
            const health = enemy.getComponent<HealthComponent>('health')
            if (health) {
                health.maxHealth = bossComponent.maxHealth
                health.currentHealth = bossComponent.maxHealth
            }
        }

        return enemy
    }

    private updateSpawnCounters(
        state: GameState,
        gameStateComponent: GameStateComponent,
    ): void {
        switch (state) {
            case GameState.WAVE_1:
                gameStateComponent.incrementWave1Spawned()
                break
            case GameState.WAVE_2:
                gameStateComponent.incrementWave2Spawned()
                break
            case GameState.BOSS_FIGHT:
                gameStateComponent.setBossSpawned()
                break
        }
    }

    private cleanupDeadEnemies(): void {
        const enemies = this.world.getEntitiesWithComponents([
            'enemy',
            'health',
        ])
        const deadEnemies = enemies.filter((enemy) => {
            const health = enemy.getComponent<HealthComponent>('health')
            return health?.isDead === true
        })

        // Award XP for each dead enemy before removing them
        if (deadEnemies.length > 0 && this.levelingSystem) {
            // Find the player entity to award XP to
            const playerEntities = this.world.getEntitiesWithComponents([
                'player',
            ])
            if (playerEntities.length > 0) {
                const player = playerEntities[0]

                for (const deadEnemy of deadEnemies) {
                    // Award XP for each enemy type (currently only basic enemies)
                    const xpAwarded = enemyXPConfig.basicEnemy
                    this.levelingSystem.awardXP(player.id, xpAwarded)
                    console.log(
                        `💀 Enemy defeated! Awarded ${xpAwarded} XP to player`,
                    )
                }
            }
        }

        // Update game state counters for dead enemies
        if (deadEnemies.length > 0 && this.gameStateSystem) {
            const currentState = this.gameStateSystem.getCurrentState()
            const gameStateComponent =
                this.gameStateSystem.getGameStateComponent()

            for (const deadEnemy of deadEnemies) {
                const isBoss = deadEnemy.getComponent<BossComponent>('boss')

                if (isBoss) {
                    gameStateComponent.setBossKilled()
                    console.log('🎉 Boss defeated!')
                } else {
                    // Regular enemy
                    switch (currentState) {
                        case GameState.WAVE_1:
                            gameStateComponent.incrementWave1Killed()
                            break
                        case GameState.WAVE_2:
                            gameStateComponent.incrementWave2Killed()
                            break
                    }
                }
            }
        }

        // Remove dead enemies from world
        for (const deadEnemy of deadEnemies) {
            // Clean up mesh if exists
            const renderable =
                deadEnemy.getComponent<RenderableComponent>('renderable')
            if (renderable?.mesh) {
                // Remove from scene (assuming parent is handling this)
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

                renderable.mesh = undefined
            }
            this.world.removeEntity(deadEnemy.id)
        }
    }
}
