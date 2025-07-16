import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import {
    defaultGameStateConfig,
    type GameStateConfig,
} from './config/GameStateConfig'
import type {
    HealthComponent,
    InputComponent,
    MovementConfigComponent,
    PositionComponent,
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
import { EnemyHealthUISystem } from './systems/EnemyHealthUISystem'
import { InputSystem } from './systems/InputSystem'
import { LevelingSystem } from './systems/LevelingSystem'
import { MovementSystem } from './systems/MovementSystem'
import { PlayerUISystem } from './systems/PlayerUISystem'
import { ProjectileMovementSystem } from './systems/ProjectileMovementSystem'
import { ProjectileSystem } from './systems/ProjectileSystem'
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
        this.newShipOfferUISystem = new NewShipOfferUISystem(this.world, canvas)
        this.cameraSystem = new CameraSystem(this.world, camera)

        // Connect systems that need references to each other
        this.gameStateSystem.setLevelingSystem(this.levelingSystem)
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
}
