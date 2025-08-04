import { Mesh } from 'three'
import type { GameStateConfig } from '../config/GameStateConfig'
import {
    defaultGameStateConfig,
    TIME_TO_SHOW_NEW_SHIP_OFFER,
} from '../config/GameStateConfig'
import type {
    GameState,
    GameStateComponent,
    HealthComponent,
    RenderableComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { GameWorld } from '../GameWorld'
import type { CameraSystem } from './CameraSystem'
import type { GameStateHandler } from './states'
import {
    BossFightState,
    InitialWaveState,
    NewShipOfferState,
    TutorialState,
    Wave1State,
    Wave2State,
} from './states'
export class GameStateSystem extends System {
    private gameStateEntity: Entity | null = null
    private gameWorld: GameWorld | null = null
    public config: GameStateConfig
    private stateHandlers: Map<string, GameStateHandler> = new Map()
    private gameStartTime: number = 0 // Track game start time
    private playerDeathTime: number = 0 // Track when player died
    private isPlayerDying: boolean = false // Flag to track if player is in dying state
    private cameraSystem: CameraSystem

    constructor(
        world: World,
        config: GameStateConfig = defaultGameStateConfig,
        cameraSystem: CameraSystem,
    ) {
        super(world, [])
        this.config = config
        this.cameraSystem = cameraSystem
        this.initializeStateHandlers()
    }

    private initializeStateHandlers(): void {
        this.stateHandlers.set('tutorial', new TutorialState())
        this.stateHandlers.set('initialWave', new InitialWaveState())
        this.stateHandlers.set('enemiesWave1', new Wave1State())
        this.stateHandlers.set('enemiesWave2', new Wave2State())
        this.stateHandlers.set(
            'bossFight',
            new BossFightState(this.cameraSystem),
        )
        this.stateHandlers.set('newShipOffer', new NewShipOfferState())
    }

    // Method to set the GameWorld reference (called from GameWorld constructor)
    setGameWorld(gameWorld: GameWorld): void {
        this.gameWorld = gameWorld
    }

    init(): void {
        // Create the game state entity if it doesn't exist
        this.ensureGameStateEntity()
    }

    update(_deltaTime: number): void {
        const gameState = this.getGameState()
        if (!gameState) return

        // Initialize game start time on first update
        if (this.gameStartTime === 0) {
            this.gameStartTime = performance.now() / 1000
        }

        // Check if configured time has passed and force boss fight if not already in boss fight
        const currentTime = performance.now() / 1000
        const gameTime = currentTime - this.gameStartTime

        if (
            gameTime >= this.config.boss.forceSpawnTimeSeconds &&
            gameState.currentState !== 'bossFight' &&
            gameState.currentState !== 'newShipOffer'
        ) {
            gameState.currentState = 'bossFight'
        }

        // Handle current state using appropriate handler
        const stateHandler = this.stateHandlers.get(gameState.currentState)
        if (stateHandler) {
            const nextState = stateHandler.handle(
                gameState,
                this.config,
                this.world,
            )
            if (nextState) {
                gameState.currentState = nextState as GameState
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
            currentState: 'tutorial',
            initialWaveEnemiesSpawned: 0,
            initialWaveEnemiesDefeated: 0,
            wave1EnemiesSpawned: 0,
            wave1EnemiesDefeated: 0,
            wave2EnemiesSpawned: 0,
            wave2EnemiesDefeated: 0,
            bossSpawned: false,
            playerHits: 0,
        }
        this.gameStateEntity.addComponent(gameState)
        this.world.addEntity(this.gameStateEntity)
    }

    private getGameState(): GameStateComponent | null {
        if (!this.gameStateEntity) return null
        return (
            this.gameStateEntity.getComponent<GameStateComponent>(
                'gameState',
            ) || null
        )
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

        // Check if player just died (start the explosion delay)
        if (playerHealth.isDead && !this.isPlayerDying) {
            this.isPlayerDying = true
            this.playerDeathTime = performance.now()
        }

        // If player is dying and 1 second has passed, show new ship offer
        if (this.isPlayerDying && playerHealth.isDead) {
            const currentTime = performance.now()
            const timeSinceDeath = (currentTime - this.playerDeathTime) / 1000 // Convert to seconds

            if (timeSinceDeath >= TIME_TO_SHOW_NEW_SHIP_OFFER) {
                gameState.currentState = 'newShipOffer'
                this.isPlayerDying = false
            }
        }
    }

    // Method to restart the game (reset to wave 1)
    public restartGame(): void {
        const gameState = this.getGameState()
        if (!gameState) return

        // Reset timing
        this.gameStartTime = 0
        this.playerDeathTime = 0
        this.isPlayerDying = false

        // Reset game state
        gameState.currentState = 'tutorial'
        gameState.initialWaveEnemiesSpawned = 0
        gameState.initialWaveEnemiesDefeated = 0
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
