import { Mesh } from 'three'
import { enemyXPConfig } from '../config/LevelingConfig'
import type {
    GameStateComponent,
    HealthComponent,
    RenderableComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import { createBossShip, createEnemyShip } from '../entities/EnemyFactory'

export class GameStateSystem extends System {
    private gameStateEntity: import('../ecs/Entity').Entity | null = null
    private levelingSystem: import('./LevelingSystem').LevelingSystem | null =
        null

    constructor(world: World) {
        super(world, [])
    }

    // Method to set the leveling system reference
    setLevelingSystem(
        levelingSystem: import('./LevelingSystem').LevelingSystem,
    ): void {
        this.levelingSystem = levelingSystem
    }

    init(): void {
        // Create the game state entity if it doesn't exist
        this.ensureGameStateEntity()
    }

    update(_deltaTime: number): void {
        const gameState = this.getGameState()
        if (!gameState) return

        // Always clean up dead enemies and award XP
        this.cleanupDeadEnemies()

        switch (gameState.currentState) {
            case 'enemiesWave1':
                this.handleWave1(gameState)
                break
            case 'enemiesWave2':
                this.handleWave2(gameState)
                break
            case 'bossFight':
                this.handleBossFight(gameState)
                break
            case 'newShipOffer':
                // This state is handled by UI system
                break
        }

        // Check for player death in any combat state
        if (gameState.currentState !== 'newShipOffer') {
            this.checkPlayerDeath(gameState)
        }
    }

    private ensureGameStateEntity(): void {
        if (this.gameStateEntity) return

        // Look for existing game state entity
        const existingGameStates = this.world.getEntitiesWithComponents([
            'gameState',
        ])
        if (existingGameStates.length > 0) {
            this.gameStateEntity = existingGameStates[0]
            return
        }

        // Create new game state entity
        this.gameStateEntity = this.world.createEntity()
        const gameState: GameStateComponent = {
            type: 'gameState',
            currentState: 'enemiesWave1',
            wave1EnemiesSpawned: 0,
            wave1EnemiesDefeated: 0,
            wave2EnemiesSpawned: 0,
            wave2EnemiesDefeated: 0,
            bossSpawned: false,
            playerHits: 0,
        }
        this.gameStateEntity.addComponent(gameState)
        this.world.addEntity(this.gameStateEntity)
        console.log('🎮 Game State: Starting Wave 1')
    }

    private getGameState(): GameStateComponent | null {
        if (!this.gameStateEntity) return null
        return (
            this.gameStateEntity.getComponent<GameStateComponent>(
                'gameState',
            ) || null
        )
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
                    // Check if it's a boss or regular enemy
                    const isBoss = deadEnemy.hasComponent('boss')
                    const xpAwarded = isBoss
                        ? enemyXPConfig.basicEnemy * 20
                        : enemyXPConfig.basicEnemy // Boss gives 20x XP
                    this.levelingSystem.awardXP(player.id, xpAwarded)

                    if (isBoss) {
                        console.log(
                            `💀 Boss defeated! Awarded ${xpAwarded} XP to player`,
                        )
                    } else {
                        console.log(
                            `💀 Enemy defeated! Awarded ${xpAwarded} XP to player`,
                        )
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

    private handleWave1(gameState: GameStateComponent): void {
        // Spawn 5 enemies for wave 1
        if (gameState.wave1EnemiesSpawned < 5) {
            this.spawnEnemyAroundPlayer()
            gameState.wave1EnemiesSpawned++
            console.log(
                `🛡️ Wave 1: Spawned enemy ${gameState.wave1EnemiesSpawned}/5`,
            )
        }

        // Check if all wave 1 enemies are defeated
        const currentEnemies = this.world.getEntitiesWithComponents([
            'enemy',
            'health',
        ])
        const aliveEnemies = currentEnemies.filter((enemy) => {
            const health = enemy.getComponent<HealthComponent>('health')
            return health && !health.isDead && !enemy.hasComponent('boss')
        })

        if (gameState.wave1EnemiesSpawned === 5 && aliveEnemies.length === 0) {
            gameState.currentState = 'enemiesWave2'
            console.log('🎮 Game State: Wave 1 Complete! Starting Wave 2')
        }
    }

    private handleWave2(gameState: GameStateComponent): void {
        // Spawn 10 enemies for wave 2
        if (gameState.wave2EnemiesSpawned < 10) {
            this.spawnEnemyAroundPlayer()
            gameState.wave2EnemiesSpawned++
            console.log(
                `🛡️ Wave 2: Spawned enemy ${gameState.wave2EnemiesSpawned}/10`,
            )
        }

        // Check if all wave 2 enemies are defeated
        const currentEnemies = this.world.getEntitiesWithComponents([
            'enemy',
            'health',
        ])
        const aliveEnemies = currentEnemies.filter((enemy) => {
            const health = enemy.getComponent<HealthComponent>('health')
            return health && !health.isDead && !enemy.hasComponent('boss')
        })

        if (gameState.wave2EnemiesSpawned === 10 && aliveEnemies.length === 0) {
            gameState.currentState = 'bossFight'
            console.log('🎮 Game State: Wave 2 Complete! Boss Fight Starting!')
        }
    }

    private handleBossFight(gameState: GameStateComponent): void {
        // Spawn boss if not already spawned
        if (!gameState.bossSpawned) {
            this.spawnBoss()
            gameState.bossSpawned = true
            console.log('💀 Boss Fight: Boss spawned!')
        }
    }

    private spawnEnemyAroundPlayer(): void {
        // Get player position for spawning reference
        const playerEntities = this.world.getEntitiesWithComponents(['player'])
        if (playerEntities.length === 0) return

        const player = playerEntities[0]
        const playerPosition =
            player.getComponent<import('../ecs/Component').PositionComponent>(
                'position',
            )
        if (!playerPosition) return

        // Choose a random spawn position around the player
        const spawnDistance = 12 // Distance from player
        const spawnAngle = Math.random() * 2 * Math.PI
        const spawnX = playerPosition.x + Math.cos(spawnAngle) * spawnDistance
        const spawnZ = playerPosition.z + Math.sin(spawnAngle) * spawnDistance

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

    private spawnBoss(): void {
        // Get player position for spawning reference
        const playerEntities = this.world.getEntitiesWithComponents(['player'])
        if (playerEntities.length === 0) return

        const player = playerEntities[0]
        const playerPosition =
            player.getComponent<import('../ecs/Component').PositionComponent>(
                'position',
            )
        if (!playerPosition) return

        // Spawn boss at a dramatic position in front of the player
        const spawnDistance = 15 // Distance from player
        const spawnX = playerPosition.x
        const spawnZ = playerPosition.z + spawnDistance // Spawn in front

        // Create boss ship
        const boss = createBossShip(
            spawnX,
            0.1, // Same Y level as player
            spawnZ,
            player.id, // Set player as target
        )

        // Add boss to world
        this.world.addEntity(boss)
    }

    private checkPlayerDeath(gameState: GameStateComponent): void {
        // Get player entity and check health
        const playerEntities = this.world.getEntitiesWithComponents([
            'player',
            'health',
        ])
        if (playerEntities.length === 0) return

        const player = playerEntities[0]
        const playerHealth = player.getComponent<HealthComponent>('health')
        if (!playerHealth) return

        // If player is dead, transition to new ship offer
        if (playerHealth.isDead) {
            gameState.currentState = 'newShipOffer'
            console.log('💀 Player died! Showing new ship offer...')
        }
    }

    // Method to restart the game (reset to wave 1)
    public restartGame(): void {
        const gameState = this.getGameState()
        if (!gameState) return

        gameState.currentState = 'enemiesWave1'
        gameState.wave1EnemiesSpawned = 0
        gameState.wave1EnemiesDefeated = 0
        gameState.wave2EnemiesSpawned = 0
        gameState.wave2EnemiesDefeated = 0
        gameState.bossSpawned = false
        gameState.playerHits = 0

        // Remove all existing enemies
        const enemies = this.world.getEntitiesWithComponents(['enemy'])
        for (const enemy of enemies) {
            this.world.removeEntity(enemy.id)
        }

        console.log('🎮 Game restarted - Wave 1 beginning')
    }
}
