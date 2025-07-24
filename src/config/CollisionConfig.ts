import type {
    BoxCollider,
    CollisionComponent,
    ModelCollider,
    SphereCollider,
} from '../ecs/Component'
import type { ModelType } from './ModelConfig'

// Collision presets for different entity types
export const collisionPresets = {
    // Ship collision presets
    playerShip: {
        shape: 'box' as const,
        width: 1,
        height: 2,
        depth: 1.8,
    } satisfies BoxCollider,

    enemyShip: {
        shape: 'box' as const,
        width: 1.6,
        height: 2,
        depth: 2.8,
    } satisfies BoxCollider,

    bossShip: {
        shape: 'box' as const,
        width: 1.4,
        height: 2,
        depth: 4.8,
    } satisfies BoxCollider,

    // Projectile collision presets
    bullet: {
        shape: 'sphere' as const,
        radius: 0.4,
    } satisfies SphereCollider,

    largeBullet: {
        shape: 'sphere' as const,
        radius: 0.4,
    } satisfies SphereCollider,

    // Custom collision presets
    smallBox: {
        shape: 'box' as const,
        width: 0.8,
        height: 0.8,
        depth: 0.8,
    } satisfies BoxCollider,

    largeBox: {
        shape: 'box' as const,
        width: 3.2,
        height: 3.2,
        depth: 3.2,
    } satisfies BoxCollider,

    smallSphere: {
        shape: 'sphere' as const,
        radius: 0.4,
    } satisfies SphereCollider,

    largeSphere: {
        shape: 'sphere' as const,
        radius: 1.6,
    } satisfies SphereCollider,
}

// Factory functions for creating collision components
export function createPlayerShipCollision(offset?: {
    x: number
    y: number
    z: number
}): CollisionComponent {
    return {
        type: 'collision',
        collider: collisionPresets.playerShip,
        offset,
    }
}

export function createEnemyShipCollision(offset?: {
    x: number
    y: number
    z: number
}): CollisionComponent {
    return {
        type: 'collision',
        collider: collisionPresets.enemyShip,
        offset,
    }
}

export function createBossShipCollision(offset?: {
    x: number
    y: number
    z: number
}): CollisionComponent {
    return {
        type: 'collision',
        collider: collisionPresets.bossShip,
        offset,
    }
}

export function createBulletCollision(offset?: {
    x: number
    y: number
    z: number
}): CollisionComponent {
    return {
        type: 'collision',
        collider: collisionPresets.bullet,
        offset,
    }
}

export function createLargeBulletCollision(offset?: {
    x: number
    y: number
    z: number
}): CollisionComponent {
    return {
        type: 'collision',
        collider: collisionPresets.largeBullet,
        offset,
    }
}

// Generic factory functions for custom collision shapes
export function createBoxCollision(
    width: number,
    height: number,
    depth: number,
    offset?: { x: number; y: number; z: number },
): CollisionComponent {
    return {
        type: 'collision',
        collider: {
            shape: 'box',
            width,
            height,
            depth,
        },
        offset,
    }
}

export function createSphereCollision(
    radius: number,
    offset?: { x: number; y: number; z: number },
): CollisionComponent {
    return {
        type: 'collision',
        collider: {
            shape: 'sphere',
            radius,
        },
        offset,
    }
}

// Type for collision preset names
export type CollisionPresetName = keyof typeof collisionPresets

// Function to get collision preset by name
export function getCollisionPreset(
    name: CollisionPresetName,
): CollisionComponent {
    const preset = collisionPresets[name]
    return {
        type: 'collision',
        collider: preset,
    }
}

// Factory function for creating model-based collision components
export function createModelCollision(
    modelType: ModelType,
    precision: 'boundingBox' | 'boundingSphere' | 'geometry' = 'boundingBox',
    scale?: number,
    offset?: { x: number; y: number; z: number },
): CollisionComponent {
    return {
        type: 'collision',
        collider: {
            shape: 'model',
            modelType,
            precision,
            scale,
        } satisfies ModelCollider,
        offset,
    }
}

// Preset model colliders for common use cases
export const modelCollisionPresets = {
    playerShipModel: {
        shape: 'model' as const,
        modelType: 'ship_lvl_1' as ModelType,
        precision: 'boundingBox' as const,
        scale: 1.5,
    } satisfies ModelCollider,

    enemyShipModel: {
        shape: 'model' as const,
        modelType: 'ship_lvl_2' as ModelType,
        precision: 'boundingBox' as const,
        scale: 1.5,
    } satisfies ModelCollider,

    bossShipModel: {
        shape: 'model' as const,
        modelType: 'boss' as ModelType,
        precision: 'boundingBox' as const,
        scale: 0.5,
    } satisfies ModelCollider,

    barrelModel: {
        shape: 'model' as const,
        modelType: 'barrel' as ModelType,
        precision: 'boundingSphere' as const,
        scale: 3.5,
    } satisfies ModelCollider,

    islandModel: {
        shape: 'model' as const,
        modelType: 'island' as ModelType,
        precision: 'geometry' as const,
        scale: 1.0,
    } satisfies ModelCollider,
}

/**
 * USAGE EXAMPLES FOR MODEL COLLIDERS
 *
 * Model colliders allow you to use actual 3D model geometry for collision detection
 * instead of simple shapes like boxes and spheres. This provides more accurate
 * collision detection at the cost of additional computation.
 *
 * Available precision levels:
 * - 'boundingBox': Fast, uses the model's bounding box (recommended for most cases)
 * - 'boundingSphere': Fast, uses the model's bounding sphere
 * - 'geometry': Slower but most accurate, uses actual mesh geometry
 *
 * Example 1: Basic model collider
 * ```typescript
 * const collision = createModelCollision('ship_lvl_1', 'boundingBox', 1.5)
 * entity.addComponent(collision)
 * ```
 *
 * Example 2: Model collider with offset
 * ```typescript
 * const collision = createModelCollision(
 *     'boss',
 *     'boundingSphere',
 *     0.5,
 *     { x: 0, y: 1, z: 0 }
 * )
 * entity.addComponent(collision)
 * ```
 *
 * Example 3: High-precision collision for complex shapes
 * ```typescript
 * const collision = createModelCollision('island', 'geometry', 1.0)
 * entity.addComponent(collision)
 * ```
 *
 * Example 4: Using preset model colliders
 * ```typescript
 * const collision: CollisionComponent = {
 *     type: 'collision',
 *     collider: modelCollisionPresets.barrelModel,
 *     offset: { x: 0, y: 0.5, z: 0 }
 * }
 * entity.addComponent(collision)
 * ```
 *
 * Performance considerations:
 * - boundingBox: Fastest, good for most rectangular/box-like objects
 * - boundingSphere: Fast, good for round objects like barrels
 * - geometry: Slowest, only use for very complex shapes where accuracy is critical
 *
 * The collision system caches collision data per model+scale combination,
 * so multiple entities using the same model collider are efficient.
 */
