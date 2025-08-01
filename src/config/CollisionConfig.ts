import type {
    BoxCollider,
    CollisionComponent,
    SphereCollider,
} from '../ecs/Component'

// Collision presets for different entity types
export const collisionPresets = {
    // Ship collision presets
    playerShip: {
        shape: 'box' as const,
        width: 1,
        height: 2,
        depth: 2.0,
    } satisfies BoxCollider,

    enemyShip: {
        shape: 'box' as const,
        width: 1.6,
        height: 2,
        depth: 2.8,
    } satisfies BoxCollider,

    bossShip: {
        shape: 'box' as const,
        width: 1.5,
        height: 2,
        depth: 7.0,
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
