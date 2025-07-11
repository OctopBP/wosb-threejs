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
    projectileType: 'sphere' // for now, just sphere
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
    // Movement behavior
    movementDirection: {
        x: number
        z: number
    }
}
