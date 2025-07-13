import type { Object3D } from 'three'
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

    // Boundaries
    boundaries: {
        minX: number
        maxX: number
        minY: number
        maxY: number
        minZ: number
        maxZ: number
    }
}

// Renderable component for Three.js mesh
export interface RenderableComponent extends Component {
    type: 'renderable'
    meshId: string
    mesh?: Object3D
    meshType: ModelType // Now properly typed with ModelType
    visible: boolean
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

// Particle component for individual particles
export interface ParticleComponent extends Component {
    type: 'particle'
    // Life cycle
    age: number
    maxAge: number
    isDead: boolean

    // Position and movement
    position: {
        x: number
        y: number
        z: number
    }
    velocity: {
        x: number
        y: number
        z: number
    }
    acceleration: {
        x: number
        y: number
        z: number
    }

    // Visual properties
    size: number
    initialSize: number
    finalSize: number

    color: {
        r: number
        g: number
        b: number
        a: number
    }
    initialColor: {
        r: number
        g: number
        b: number
        a: number
    }
    finalColor: {
        r: number
        g: number
        b: number
        a: number
    }

    // Rotation
    rotation: number
    rotationSpeed: number

    // Sprite sheet animation (if applicable)
    spriteIndex: number
    totalSprites: number
    spriteAnimationSpeed: number

    // Physics
    gravity: number
    drag: number
}

// Particle emitter component for creating particles
export interface ParticleEmitterComponent extends Component {
    type: 'particleEmitter'
    // Emission settings
    emissionType: 'burst' | 'continuous'
    burstCount: number // Number of particles to emit in a burst
    emissionRate: number // Particles per second for continuous emission
    lastEmissionTime: number

    // Position and area
    position: {
        x: number
        y: number
        z: number
    }
    emissionArea: {
        type: 'point' | 'sphere' | 'box' | 'circle'
        radius?: number
        width?: number
        height?: number
        depth?: number
    }

    // Particle properties
    particleConfig: {
        // Life
        minAge: number
        maxAge: number

        // Size
        minSize: number
        maxSize: number
        sizeOverLifetime: boolean
        finalSizeMultiplier: number

        // Color
        color: {
            r: number
            g: number
            b: number
            a: number
        }
        colorOverLifetime: boolean
        finalColor: {
            r: number
            g: number
            b: number
            a: number
        }

        // Velocity
        minSpeed: number
        maxSpeed: number
        direction: {
            x: number
            y: number
            z: number
        }
        directionSpread: number // Angle in radians

        // Physics
        gravity: number
        drag: number

        // Rotation
        minRotationSpeed: number
        maxRotationSpeed: number

        // Sprite sheet
        useSpriteSheet: boolean
        spriteSheetConfig?: {
            textureUrl: string
            columns: number
            rows: number
            totalFrames: number
            animationSpeed: number
        }
    }

    // Emitter state
    isActive: boolean
    totalEmitted: number
    maxParticles?: number // Optional limit on total particles
}

// Particle renderer component for visual representation
export interface ParticleRendererComponent extends Component {
    type: 'particleRenderer'
    // Render type
    renderType: 'sprite' | 'shape' | 'spriteSheet'

    // Shape properties (for shape render type)
    shapeType: 'circle' | 'square' | 'triangle'

    // Texture properties (for sprite render types)
    textureUrl?: string
    texture?: any // Three.js texture

    // Material properties
    material?: any // Three.js material
    blending: 'normal' | 'additive' | 'multiply'

    // Rendering
    mesh?: any // Three.js mesh
    visible: boolean
}
