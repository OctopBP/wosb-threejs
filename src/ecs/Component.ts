import type { Object3D } from 'three'
import type { VisualUpgradeConfig } from '../config/LevelingConfig'
import type { ModelType } from '../config/ModelConfig'

// Base Component interface for ECS system
export interface Component {
    readonly type: string
}

// Position component for entity location and rotation
export interface PositionComponent extends Component {
    type: 'position'
    x: number
    y: number
    z: number
    rotationX: number
    rotationY: number
    rotationZ: number
    // Original values for wave rocking system
    originalY?: number
    originalRotationX?: number
    originalRotationZ?: number
}

// Velocity component for entity movement
export interface VelocityComponent extends Component {
    type: 'velocity'
    dx: number
    dy: number
    dz: number
    angularVelocityX: number
    angularVelocityY: number
    angularVelocityZ: number
}

// Input component for storing current input state and processed direction
export interface InputComponent extends Component {
    type: 'input'
    // Raw input state
    moveForward: boolean
    moveBackward: boolean
    moveLeft: boolean
    moveRight: boolean
    pointerX: number
    pointerY: number
    isTouching: boolean
    isPointerDown: boolean

    // Processed output - direction vector
    direction: {
        x: number // -1 to 1 (left/right)
        y: number // -1 to 1 (forward/backward)
    }
    hasInput: boolean
}

// Movement configuration component
export interface MovementConfigComponent extends Component {
    type: 'movementConfig'
    // Acceleration settings
    accelerationForce: number
    decelerationForce: number
    maxSpeed: number

    // Rotation settings
    autoRotationStrength: number // How much the ship auto-rotates towards movement direction

    // Input processing settings
    inputResponsiveness: number
    inputDeadZone: number
    pointerSensitivity: number

    // Movement dampening
    linearDampening: number
}

// Renderable component for Three.js mesh
export interface RenderableComponent extends Component {
    type: 'renderable'
    meshId: string
    mesh?: Object3D
    meshType: ModelType // Now properly typed with ModelType
    visible: boolean
    upgrades: Record<number, VisualUpgradeConfig>
}

// Player tag component
export interface PlayerComponent extends Component {
    type: 'player'
}

// Health component for entities that can take damage
export interface HealthComponent extends Component {
    type: 'health'
    maxHealth: number
    currentHealth: number
    isDead: boolean
}

// Weapon component for entities that can shoot
export interface WeaponComponent extends Component {
    type: 'weapon'
    damage: number
    fireRate: number // shots per second
    projectileSpeed: number
    range: number
    lastShotTime: number
    projectileType: 'bullet' // for now, just sphere
    // Auto-targeting properties
    isAutoTargeting: boolean // whether this weapon auto-aims at enemies
    detectionRange: number // range for enemy detection (can be different from firing range)
    requiresLineOfSight: boolean // whether to check for obstacles (future feature)
    // Shooting points relative to ship position
    shootingPoints: Array<{ x: number; y: number }> // relative positions where cannons are located
}

// Projectile component for projectile entities
export interface ProjectileComponent extends Component {
    type: 'projectile'
    damage: number
    speed: number
    ownerId: number // entity id that fired this projectile
    maxLifetime: number
    currentLifetime: number
}

// Collision shape types using discriminated unions
export type BoxCollider = {
    shape: 'box'
    width: number
    height: number
    depth: number
}

export type SphereCollider = {
    shape: 'sphere'
    radius: number
}

// Collision component for configurable collision shapes
export interface CollisionComponent extends Component {
    type: 'collision'
    collider: BoxCollider | SphereCollider
    // Optional offset from entity position
    offset?: {
        x: number
        y: number
        z: number
    }
}

// Damageable component for entities that can receive damage
export interface DamageableComponent extends Component {
    type: 'damageable'
    // This is a marker component that works with HealthComponent
}

// Enemy tag component
export interface EnemyComponent extends Component {
    type: 'enemy'
}

// Enemy AI component for controlling enemy behavior
export interface EnemyAIComponent extends Component {
    type: 'enemyAI'
    // AI behavior state
    moveSpeed: number
    shootingRange: number
    lastShotTime: number
    // Target tracking
    targetId: number | null
}

// XP (Experience Points) component for tracking player progression
export interface XPComponent extends Component {
    type: 'xp'
    currentXP: number
    totalXP: number // Total XP gained throughout the game
}

// Level component for tracking player level and level-up state
export interface LevelComponent extends Component {
    type: 'level'
    currentLevel: number
    maxLevel: number
    // Level-up state tracking
    hasLeveledUp: boolean // Flag to trigger level-up effects
    levelUpTime: number // Timestamp of last level up for animations
}

// Leveling Stats component for stat improvements per level
export interface LevelingStatsComponent extends Component {
    type: 'levelingStats'
    baseDamage: number
    damagePerLevel: number
    baseFireRate: number
    fireRatePerLevel: number
    baseMaxHealth: number
    healthPerLevel: number
    baseMaxSpeed: number
    speedPerLevel: number
}

// Camera Target component for entities that the camera should focus on
export interface CameraTargetComponent extends Component {
    type: 'cameraTarget'
    priority: number // Higher priority targets are focused on first
    targetType: 'player' | 'enemy' | 'boss' | 'cinematic'
    offset: {
        x: number
        y: number
        z: number
    }
    // Optional custom camera state for this target
    customCameraState?: string
}

// Camera State component for managing camera transitions and effects
export interface CameraStateComponent extends Component {
    type: 'cameraState'
    currentState: string
    targetState: string
    transitionProgress: number // 0 to 1
    transitionDuration: number
    transitionEasing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut'

    // Screen shake state
    screenShake: {
        active: boolean
        intensity: number
        frequency: number
        duration: number
        elapsedTime: number
        originalPosition: { x: number; y: number; z: number }
    }

    // Zoom state
    zoom: {
        active: boolean
        targetFOV: number
        startFOV: number
        duration: number
        elapsedTime: number
    }

    // Current camera position and target
    position: { x: number; y: number; z: number }
    target: { x: number; y: number; z: number }
    fov: number
}

// Range Indicator component for entities that need shooting range circles
export interface RangeIndicatorComponent extends Component {
    type: 'rangeIndicator'
    showRangeCircle: boolean
    rangeCircleRadius: number
    rangeCircleMesh?: Object3D
    // Visual settings
    rangeCircleColor: number
    rangeCircleOpacity: number
}

// Enemy Arrow component for entities that need directional arrows to enemies
export interface EnemyArrowComponent extends Component {
    type: 'enemyArrow'
    showEnemyArrows: boolean
    enemyArrows: Array<{
        enemyId: number
        arrowMesh?: Object3D
        direction: { x: number; z: number }
        distance: number
    }>
    // Visual settings
    arrowColor: number
    arrowScale: number
    maxArrows: number
}

// Game state and boss components from dev branch
export type GameState =
    | 'enemiesWave1'
    | 'enemiesWave2'
    | 'bossFight'
    | 'newShipOffer'

// Game State component for managing overall game state
export interface GameStateComponent extends Component {
    type: 'gameState'
    currentState: GameState
    wave1EnemiesSpawned: number
    wave1EnemiesDefeated: number
    wave2EnemiesSpawned: number
    wave2EnemiesDefeated: number
    bossSpawned: boolean
    playerHits: number // Track hits taken by player for boss encounter
}

// Boss tag component for boss entities
export interface BossComponent extends Component {
    type: 'boss'
    bossType: 'basic' // For future expansion
    damagePerShot: number // How much damage boss deals per shot
}

// Debug component for controlling debug visualizations
export interface DebugComponent extends Component {
    type: 'debug'
    enabled: boolean
    showShootingPoints: boolean
    showCollisionShapes: boolean
    showWeaponRange: boolean
    showVelocityVectors: boolean
}

// Death animation component for sinking ship effects
export interface DeathAnimationComponent extends Component {
    type: 'deathAnimation'
    sinkSpeed: number // Speed at which ship sinks underwater
    originalY: number // Original Y position before sinking
    sinkDuration: number // Total time to complete sinking animation
    currentTime: number // Current time in animation
    wreckageTriggered: boolean // Whether wreckage particles have been triggered
}
