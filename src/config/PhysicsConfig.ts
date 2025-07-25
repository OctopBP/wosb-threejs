import type { PhysicsComponent } from '../ecs/Component'

export interface PhysicsPreset {
    mass: number
    friction: number
    restitution: number
    drag: number
    isKinematic: boolean
    enableCollisionResponse: boolean
}

// Default physics preset for balanced gameplay
export const defaultPhysicsPreset: PhysicsPreset = {
    mass: 1.0,
    friction: 2.0,
    restitution: 0.3,
    drag: 0.5,
    isKinematic: false,
    enableCollisionResponse: true,
}

// Player ship physics - responsive and agile
export const playerPhysicsPreset: PhysicsPreset = {
    mass: 1.0, // Standard mass for good responsiveness
    friction: 1.5, // Lower friction for more responsive movement
    restitution: 0.4, // Moderate bounce for interesting collisions
    drag: 0.3, // Lower drag for better control
    isKinematic: false,
    enableCollisionResponse: true,
}

// Enemy ship physics - slightly heavier and less responsive
export const enemyPhysicsPreset: PhysicsPreset = {
    mass: 1.2, // Slightly heavier than player
    friction: 2.5, // Higher friction, less agile
    restitution: 0.2, // Less bouncy
    drag: 0.6, // More drag
    isKinematic: false,
    enableCollisionResponse: true,
}

// Boss ship physics - heavy and imposing
export const bossPhysicsPreset: PhysicsPreset = {
    mass: 3.0, // Much heavier than other ships
    friction: 3.0, // High friction, slow to change direction
    restitution: 0.1, // Very low bounce
    drag: 0.8, // High drag
    isKinematic: false,
    enableCollisionResponse: true,
}

// Projectile physics - no collision response but can be affected by physics
export const projectilePhysicsPreset: PhysicsPreset = {
    mass: 0.1, // Very light
    friction: 0.1, // Very low friction
    restitution: 0.0, // No bounce
    drag: 0.1, // Minimal drag
    isKinematic: true, // Don't respond to collisions
    enableCollisionResponse: false,
}

// Barrel physics - light and bouncy
export const barrelPhysicsPreset: PhysicsPreset = {
    mass: 0.5, // Light weight
    friction: 1.0, // Moderate friction
    restitution: 0.6, // Quite bouncy
    drag: 0.4, // Moderate drag
    isKinematic: false,
    enableCollisionResponse: true,
}

/**
 * Create a physics component with the given preset
 */
export function createPhysicsComponent(
    preset: PhysicsPreset = defaultPhysicsPreset,
): PhysicsComponent {
    return {
        type: 'physics',
        mass: preset.mass,
        friction: preset.friction,
        restitution: preset.restitution,
        drag: preset.drag,
        lastCollisionForce: { x: 0, y: 0, z: 0 },
        isKinematic: preset.isKinematic,
        enableCollisionResponse: preset.enableCollisionResponse,
    }
}

/**
 * Create physics component with custom overrides
 */
export function createCustomPhysicsComponent(
    preset: PhysicsPreset = defaultPhysicsPreset,
    overrides: Partial<PhysicsPreset> = {},
): PhysicsComponent {
    const config = { ...preset, ...overrides }
    return createPhysicsComponent(config)
}
