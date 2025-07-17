import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { ARROW_INDICATOR_CONFIG } from './config/ArrowIndicatorConfig'
import type { GameStateConfig } from './config/GameStateConfig'
import { defaultGameStateConfig } from './config/GameStateConfig'
import type {
    EnemyArrowComponent,
    HealthComponent,
    InputComponent,
    MovementConfigComponent,
    PositionComponent,
    RangeIndicatorComponent,
    VelocityComponent,
    WeaponComponent,
} from './ecs'
import type { Entity } from './ecs/Entity'
import { World } from './ecs/World'
import {
    createPlayerShip,
    equipAutoTargetingWeapon,
    equipManualWeapon,
    hasAutoTargetingWeapon,
    updateMovementConfig,
    updateWeaponConfig,
} from './entities/PlayerFactory'
import { EnemyAISystem, GameStateSystem, NewShipOfferUISystem } from './systems'
import { AccelerationSystem } from './systems/AccelerationSystem'
import { CameraSystem } from './systems/CameraSystem'
import { CollisionSystem } from './systems/CollisionSystem'
import { EnemyArrowSystem } from './systems/EnemyArrowSystem'
import { EnemyHealthUISystem } from './systems/EnemyHealthUISystem'
import { InputSystem } from './systems/InputSystem'
import { LevelingSystem } from './systems/LevelingSystem'
import { MovementSystem } from './systems/MovementSystem'
import { PlayerUISystem } from './systems/PlayerUISystem'
import { ProjectileMovementSystem } from './systems/ProjectileMovementSystem'
import { ProjectileSystem } from './systems/ProjectileSystem'
import { RangeIndicatorSystem } from './systems/RangeIndicatorSystem'
import { RenderSystem } from './systems/RenderSystem'
import { RotationSystem } from './systems/RotationSystem'
import { VirtualJoystickSystem } from './systems/VirtualJoystickSystem'
import { WeaponSystem } from './systems/WeaponSystem'
export class GameWorld {
    private world: World
    private inputSystem: InputSystem
    private virtualJoystickSystem: VirtualJoystickSystem
    private rotationSystem: RotationSystem
    private accelerationSystem: AccelerationSystem
    private movementSystem: MovementSystem
    private weaponSystem: WeaponSystem
    private projectileMovementSystem: ProjectileMovementSystem
    private projectileSystem: ProjectileSystem
    private collisionSystem: CollisionSystem
    private renderSystem: RenderSystem
    private gameStateSystem: GameStateSystem
    private enemyAISystem: EnemyAISystem
    private levelingSystem: LevelingSystem
    private playerUISystem: PlayerUISystem
    private enemyHealthUISystem: EnemyHealthUISystem
    private newShipOfferUISystem: NewShipOfferUISystem
    private cameraSystem: CameraSystem
    private rangeIndicatorSystem: RangeIndicatorSystem
    private enemyArrowSystem: EnemyArrowSystem
    private playerEntity: Entity | null = null
    private lastTime: number = 0

    constructor(
        private scene: Scene,
        private renderer: WebGLRenderer,
        private canvas: HTMLCanvasElement,
        private camera: PerspectiveCamera,
        gameStateConfig: GameStateConfig = defaultGameStateConfig,
    ) {
        this.world = new World()

        // Initialize systems in the correct order
        this.inputSystem = new InputSystem(this.world, canvas)
        this.virtualJoystickSystem = new VirtualJoystickSystem(
            this.world,
            canvas,
        )
        this.rotationSystem = new RotationSystem(this.world)
        this.accelerationSystem = new AccelerationSystem(this.world)
        this.movementSystem = new MovementSystem(this.world)
        this.weaponSystem = new WeaponSystem(this.world, scene)
        this.projectileMovementSystem = new ProjectileMovementSystem(this.world)
        this.projectileSystem = new ProjectileSystem(this.world)
        this.collisionSystem = new CollisionSystem(this.world)
        this.renderSystem = new RenderSystem(this.world, scene)
        this.gameStateSystem = new GameStateSystem(this.world, gameStateConfig)
        this.enemyAISystem = new EnemyAISystem(this.world)
        this.levelingSystem = new LevelingSystem(this.world)
        this.playerUISystem = new PlayerUISystem(this.world, camera, canvas)
        this.enemyHealthUISystem = new EnemyHealthUISystem(
            this.world,
            camera,
            canvas,
        )
        this.newShipOfferUISystem = new NewShipOfferUISystem(this.world)
        this.cameraSystem = new CameraSystem(this.world, camera)
        this.rangeIndicatorSystem = new RangeIndicatorSystem(this.world, scene)
        this.enemyArrowSystem = new EnemyArrowSystem(this.world, scene)

        // Connect systems that need references to each other
        this.gameStateSystem.setLevelingSystem(this.levelingSystem)
        this.gameStateSystem.setGameWorld(this)
        this.newShipOfferUISystem.setGameStateSystem(this.gameStateSystem)
        this.inputSystem.setVirtualJoystickSystem(this.virtualJoystickSystem)

        // Add systems to world in execution order
        this.world.addSystem(this.virtualJoystickSystem) // 0. Handle virtual joystick UI
        this.world.addSystem(this.inputSystem) // 1. Handle input events and process to direction
        this.world.addSystem(this.gameStateSystem) // 2. Manage game state and spawn enemies
        this.world.addSystem(this.enemyAISystem) // 3. Update enemy AI (movement and targeting)
        this.world.addSystem(this.rotationSystem) // 4. Handle rotation
        this.world.addSystem(this.accelerationSystem) // 5. Apply acceleration/deceleration
        this.world.addSystem(this.movementSystem) // 6. Apply velocity to position (ships only)
        this.world.addSystem(this.weaponSystem) // 7. Handle weapon firing
        this.world.addSystem(this.projectileMovementSystem) // 8. Move projectiles with gravity
        this.world.addSystem(this.projectileSystem) // 9. Update projectile lifetimes
        this.world.addSystem(this.collisionSystem) // 10. Check collisions and apply damage
        this.world.addSystem(this.levelingSystem) // 11. Handle XP gain and level-ups
        this.world.addSystem(this.playerUISystem) // 12. Update leveling and health UI
        this.world.addSystem(this.enemyHealthUISystem) // 13. Update enemy health UI
        this.world.addSystem(this.newShipOfferUISystem) // 14. Handle new ship offer UI
        this.world.addSystem(this.cameraSystem) // 15. Update camera system
        this.world.addSystem(this.renderSystem) // 16. Render the results
    }

    init(): void {
        this.playerEntity = createPlayerShip()
        if (this.playerEntity) {
            this.world.addEntity(this.playerEntity)
            // Add camera target to player
            this.cameraSystem.addCameraTarget(
                this.playerEntity.id,
                'player',
                10,
            )

            // Enable visual guidance for the player
            this.enablePlayerVisualGuidance({
                showRangeCircle: ARROW_INDICATOR_CONFIG.defaultShowRangeCircle,
                showEnemyArrows: ARROW_INDICATOR_CONFIG.defaultShowEnemyArrows,
                maxArrows: ARROW_INDICATOR_CONFIG.defaultMaxArrows,
                rangeCircleColor:
                    ARROW_INDICATOR_CONFIG.defaultRangeCircleColor,
                arrowColor: ARROW_INDICATOR_CONFIG.defaultArrowColor,
            })
        }
    }

    update(time: number): void {
        // Calculate delta time
        const deltaTime =
            this.lastTime === 0 ? 0 : (time - this.lastTime) / 1000
        this.lastTime = time

        // Clamp delta time to prevent large jumps
        const clampedDeltaTime = Math.min(deltaTime, 1 / 30) // Max 30 FPS minimum

        // Update all systems
        this.world.update(clampedDeltaTime)
    }

    // Method to access GameStateSystem for configuration changes
    getGameStateSystem(): GameStateSystem {
        return this.gameStateSystem
    }

    // Method to change game difficulty
    setGameDifficulty(config: GameStateConfig): void {
        this.gameStateSystem.setConfig(config)
        console.log('🎮 Game difficulty updated')
    }

    getPlayerEntity(): Entity | null {
        return this.playerEntity
    }

    getEntityCount(): number {
        return this.world.getEntityCount()
    }

    // Configuration methods for tuning movement
    updatePlayerMovementConfig(
        overrides: Partial<MovementConfigComponent>,
    ): void {
        if (this.playerEntity) {
            updateMovementConfig(this.playerEntity, overrides)
        }
    }

    // Configuration methods for tuning weapons
    updatePlayerWeaponConfig(
        overrides: Partial<Omit<WeaponComponent, 'type' | 'lastShotTime'>>,
    ): void {
        if (this.playerEntity) {
            updateWeaponConfig(this.playerEntity, overrides)
        }
    }

    // Method to equip player with auto-targeting weapon
    equipPlayerAutoTargetingWeapon(
        overrides: Partial<Omit<WeaponComponent, 'type' | 'lastShotTime'>> = {},
    ): void {
        if (this.playerEntity) {
            equipAutoTargetingWeapon(this.playerEntity, overrides)
        }
    }

    // Method to equip player with manual weapon
    equipPlayerManualWeapon(
        overrides: Partial<Omit<WeaponComponent, 'type' | 'lastShotTime'>> = {},
    ): void {
        if (this.playerEntity) {
            equipManualWeapon(this.playerEntity, overrides)
        }
    }

    // Method to check if player has auto-targeting weapon
    playerHasAutoTargetingWeapon(): boolean {
        return this.playerEntity
            ? hasAutoTargetingWeapon(this.playerEntity)
            : false
    }

    // Method to toggle between weapon types
    togglePlayerWeaponType(): void {
        if (this.playerEntity) {
            if (hasAutoTargetingWeapon(this.playerEntity)) {
                equipManualWeapon(this.playerEntity)
            } else {
                equipAutoTargetingWeapon(this.playerEntity)
            }
        }
    }

    // Visual guidance methods
    enablePlayerVisualGuidance(
        options: {
            showRangeCircle?: boolean
            showEnemyArrows?: boolean
            maxArrows?: number
            rangeCircleColor?: number
            arrowColor?: number
        } = {},
    ): void {
        if (!this.playerEntity) return

        const {
            showRangeCircle = ARROW_INDICATOR_CONFIG.defaultShowRangeCircle,
            showEnemyArrows = ARROW_INDICATOR_CONFIG.defaultShowEnemyArrows,
            maxArrows = ARROW_INDICATOR_CONFIG.defaultMaxArrows,
            rangeCircleColor = ARROW_INDICATOR_CONFIG.defaultRangeCircleColor,
            arrowColor = ARROW_INDICATOR_CONFIG.defaultArrowColor,
        } = options

        // Add range indicator component
        if (showRangeCircle) {
            this.playerEntity.addComponent({
                type: 'rangeIndicator',
                showRangeCircle: true,
                rangeCircleRadius: 0,
                rangeCircleColor,
                rangeCircleOpacity:
                    ARROW_INDICATOR_CONFIG.defaultRangeCircleOpacity,
            })
        }

        // Add enemy arrow component
        if (showEnemyArrows) {
            this.playerEntity.addComponent({
                type: 'enemyArrow',
                showEnemyArrows: true,
                enemyArrows: [],
                arrowColor,
                arrowScale: ARROW_INDICATOR_CONFIG.defaultArrowScale,
                maxArrows,
            })
        }
    }

    disablePlayerVisualGuidance(): void {
        if (!this.playerEntity) return
        this.playerEntity.removeComponent('rangeIndicator')
        this.playerEntity.removeComponent('enemyArrow')
    }

    enablePlayerRangeIndicator(
        options: {
            rangeCircleColor?: number
            rangeCircleOpacity?: number
        } = {},
    ): void {
        if (!this.playerEntity) return

        const {
            rangeCircleColor = 0x00ff00, // Green
            rangeCircleOpacity = 0.3,
        } = options

        this.playerEntity.addComponent({
            type: 'rangeIndicator',
            showRangeCircle: true,
            rangeCircleRadius: 0,
            rangeCircleColor,
            rangeCircleOpacity,
        })
    }

    disablePlayerRangeIndicator(): void {
        if (!this.playerEntity) return
        this.playerEntity.removeComponent('rangeIndicator')
    }

    enablePlayerEnemyArrows(
        options: {
            maxArrows?: number
            arrowColor?: number
            arrowScale?: number
        } = {},
    ): void {
        if (!this.playerEntity) return

        const {
            maxArrows = ARROW_INDICATOR_CONFIG.defaultMaxArrows,
            arrowColor = ARROW_INDICATOR_CONFIG.defaultArrowColor,
            arrowScale = ARROW_INDICATOR_CONFIG.defaultArrowScale,
        } = options

        this.playerEntity.addComponent({
            type: 'enemyArrow',
            showEnemyArrows: true,
            enemyArrows: [],
            arrowColor,
            arrowScale,
            maxArrows,
        })
    }

    disablePlayerEnemyArrows(): void {
        if (!this.playerEntity) return
        this.playerEntity.removeComponent('enemyArrow')
    }

    updatePlayerVisualGuidance(options: {
        showRangeCircle?: boolean
        showEnemyArrows?: boolean
        maxArrows?: number
        rangeCircleColor?: number
        arrowColor?: number
    }): void {
        if (!this.playerEntity) return

        // Update range indicator if exists
        const rangeIndicator =
            this.playerEntity.getComponent<RangeIndicatorComponent>(
                'rangeIndicator',
            )
        if (rangeIndicator) {
            if (options.showRangeCircle !== undefined) {
                rangeIndicator.showRangeCircle = options.showRangeCircle
            }
            if (options.rangeCircleColor !== undefined) {
                rangeIndicator.rangeCircleColor = options.rangeCircleColor
            }
        }

        // Update enemy arrow component if exists
        const enemyArrow =
            this.playerEntity.getComponent<EnemyArrowComponent>('enemyArrow')
        if (enemyArrow) {
            if (options.showEnemyArrows !== undefined) {
                enemyArrow.showEnemyArrows = options.showEnemyArrows
            }
            if (options.maxArrows !== undefined) {
                enemyArrow.maxArrows = options.maxArrows
            }
            if (options.arrowColor !== undefined) {
                enemyArrow.arrowColor = options.arrowColor
            }
        }
    }

    // Method to enable/disable auto-targeting weapon debug logging
    setAutoTargetingDebug(enabled: boolean): void {
        this.weaponSystem.setAutoTargetingDebug(enabled)
    }

    // Camera system methods
    transitionToCameraState(stateName: string, duration?: number): void {
        this.cameraSystem.transitionToState(stateName, duration)
    }

    triggerScreenShake(
        intensity: number,
        frequency: number,
        duration: number,
    ): void {
        this.cameraSystem.triggerScreenShake(intensity, frequency, duration)
    }

    triggerScreenShakePreset(
        presetName: 'light' | 'medium' | 'heavy' | 'boss',
    ): void {
        this.cameraSystem.triggerScreenShakePreset(presetName)
    }

    triggerZoom(targetFOV: number, duration: number): void {
        this.cameraSystem.triggerZoom(targetFOV, duration)
    }

    triggerZoomPreset(
        presetName: 'close' | 'medium' | 'far' | 'cinematic',
    ): void {
        this.cameraSystem.triggerZoomPreset(presetName)
    }

    addCameraTarget(
        entityId: number,
        targetType: 'player' | 'enemy' | 'boss' | 'cinematic',
        priority: number = 0,
    ): void {
        this.cameraSystem.addCameraTarget(entityId, targetType, priority)
    }

    getCurrentCameraState(): string | null {
        return this.cameraSystem.getCurrentState()
    }

    // Debug methods
    getPlayerPosition(): { x: number; y: number; z: number } | null {
        if (!this.playerEntity) return null

        const position =
            this.playerEntity.getComponent<PositionComponent>('position')
        return position ? { x: position.x, y: position.y, z: position.z } : null
    }

    getPlayerVelocity(): { dx: number; dy: number; dz: number } | null {
        if (!this.playerEntity) return null

        const velocity =
            this.playerEntity.getComponent<VelocityComponent>('velocity')
        return velocity
            ? { dx: velocity.dx, dy: velocity.dy, dz: velocity.dz }
            : null
    }

    getPlayerInputDirection() {
        if (!this.playerEntity) return null

        const input = this.playerEntity.getComponent<InputComponent>('input')
        return input
            ? {
                  direction: { x: input.direction.x, y: input.direction.y },
                  hasInput: input.hasInput,
              }
            : null
    }

    getPlayerHealth(): {
        current: number
        max: number
        isDead: boolean
    } | null {
        if (!this.playerEntity) return null

        const health = this.playerEntity.getComponent<HealthComponent>('health')
        return health
            ? {
                  current: health.currentHealth,
                  max: health.maxHealth,
                  isDead: health.isDead,
              }
            : null
    }

    cleanup(): void {
        this.world.clear()
        this.playerEntity = null
    }

    // Method to restart the player entity (recreate fresh player after game restart)
    restartPlayer(): void {
        // Clear any existing player reference
        this.playerEntity = null

        // Create a fresh player entity
        this.playerEntity = createPlayerShip()
        if (this.playerEntity) {
            this.world.addEntity(this.playerEntity)

            // Reset camera target to the new player
            this.cameraSystem.addCameraTarget(
                this.playerEntity.id,
                'player',
                10,
            )

            console.log('🎮 Player entity recreated successfully')
        }
    }
}
