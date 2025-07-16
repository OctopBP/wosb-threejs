import { Mesh } from 'three'
import {
    defaultGameStateConfig,
    type GameStateConfig,
} from '../config/GameStateConfig'
import { enemyXPConfig } from '../config/LevelingConfig'
import type {
    GameStateComponent,
    HealthComponent,
    RenderableComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import {
    BossFightState,
    type GameStateHandler,
    NewShipOfferState,
    Wave1State,
    Wave2State,
} from './states'

export class GameStateSystem extends System {
    private gameStateEntity: import('../ecs/Entity').Entity | null = null
    private levelingSystem: import('./LevelingSystem').LevelingSystem | null =
        null
    private gameWorld: import('../GameWorld').GameWorld | null = null
    private config: GameStateConfig
    private stateHandlers: Map<string, GameStateHandler> = new Map()

    constructor(
        world: World,
        config: GameStateConfig = defaultGameStateConfig,
    ) {
        super(world, [])
        this.config = config
        this.initializeStateHandlers()
    }

    private initializeStateHandlers(): void {
        this.stateHandlers = new Map([
            ['enemiesWave1', new Wave1State()],
            ['enemiesWave2', new Wave2State()],
            ['bossFight', new BossFightState()],
            ['newShipOffer', new NewShipOfferState()],
        ])
    }

    // Method to set the leveling system reference (called from GameWorld constructor)
    setLevelingSystem(
        levelingSystem: import('./LevelingSystem').LevelingSystem,
    ): void {
        this.levelingSystem = levelingSystem
    }

    // Method to set the GameWorld reference (called from GameWorld constructor)
    setGameWorld(gameWorld: import('../GameWorld').GameWorld): void {
        this.gameWorld = gameWorld
    }

    // Method to update configuration (useful for difficulty changes)
    setConfig(config: GameStateConfig): void {
        this.config = config
        console.log('🎮 Game State configuration updated')
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

        // Handle current state using appropriate handler
        const stateHandler = this.stateHandlers.get(gameState.currentState)
        if (stateHandler) {
            const nextState = stateHandler.handle(
                gameState,
                this.config,
                this.world,
                this.levelingSystem,
            )
            if (nextState) {
                gameState.currentState = nextState as any
            }
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
                    // Check if it's a boss or regular enemy and use configured XP multipliers
                    const isBoss = deadEnemy.hasComponent('boss')
                    const xpMultiplier = isBoss
                        ? this.config.boss.xpMultiplier
                        : 1
                    const xpAwarded = enemyXPConfig.basicEnemy * xpMultiplier
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

        console.log('🎮 Starting complete game restart...')

        // Reset game state
        gameState.currentState = 'enemiesWave1'
        gameState.wave1EnemiesSpawned = 0
        gameState.wave1EnemiesDefeated = 0
        gameState.wave2EnemiesSpawned = 0
        gameState.wave2EnemiesDefeated = 0
        gameState.bossSpawned = false
        gameState.playerHits = 0

        // Get all entities BEFORE removing any (to avoid iterator issues)
        const allEntities = Array.from(this.world.getAllEntities())

        // Remove all entities except the game state entity
        for (const entity of allEntities) {
            // Skip the game state entity itself
            if (entity === this.gameStateEntity) {
                continue
            }

            // Clean up mesh if exists to prevent memory leaks
            const renderable =
                entity.getComponent<RenderableComponent>('renderable')
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

                renderable.mesh = undefined
            }

            // Remove entity from world
            this.world.removeEntity(entity.id)
        }

        console.log('🎮 Game restart cleanup complete - Wave 1 beginning')

        // Recreate the player entity fresh
        if (this.gameWorld) {
            this.gameWorld.restartPlayer()
        } else {
            console.warn(
                '⚠️ GameWorld reference not set - player may not be recreated properly',
            )
        }
    }

    // Method to get current configuration (useful for debugging)
    public getConfig(): GameStateConfig {
        return this.config
    }
}
