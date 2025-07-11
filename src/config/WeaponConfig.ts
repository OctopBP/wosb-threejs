import type { WeaponComponent } from '../ecs/Component'

export type WeaponConfigPreset = Omit<WeaponComponent, 'type' | 'lastShotTime'>

// Basic cannon configuration for player ship
export const basicCannonPreset: WeaponConfigPreset = {
    damage: 25,
    fireRate: 0.75, // Every 1.5 seconds (1/0.75 shots per second)
    projectileSpeed: 10.0,
    range: 15.0,
    projectileType: 'sphere',
    // Manual targeting (traditional weapon)
    isAutoTargeting: false,
    detectionRange: 15.0, // Same as range for manual weapons
    requiresLineOfSight: false,
}

// Auto-targeting weapon configuration for player ship
export const autoTargetingCannonPreset: WeaponConfigPreset = {
    damage: 25, // Slightly less damage than manual weapon for balance
    fireRate: 1.0, // Faster fire rate to compensate for lower damage
    projectileSpeed: 15.0, // Faster projectiles for better tracking
    range: 18.0, // Longer range for auto-targeting
    projectileType: 'sphere',
    // Auto-targeting properties
    isAutoTargeting: true,
    detectionRange: 15.0, // Larger detection range than firing range
    requiresLineOfSight: false, // Simple implementation for now
}

// Fast auto-targeting weapon (alternative configuration)
export const fastAutoTargetingPreset: WeaponConfigPreset = {
    damage: 15, // Lower damage
    fireRate: 2.0, // Much faster fire rate
    projectileSpeed: 15.0, // Very fast projectiles
    range: 15.0, // Standard range
    projectileType: 'sphere',
    // Auto-targeting properties
    isAutoTargeting: true,
    detectionRange: 18.0,
    requiresLineOfSight: false,
}

// Projectile physics configuration
export const projectilePhysicsConfig = {
    gravity: -9.8, // Gravity acceleration (m/s²)
    upwardVelocity: 2.0, // Initial upward velocity for arc trajectory
    heightOffset: 0.2, // How high above shooter to spawn projectile
    forwardOffset: 0.5, // How far in front of shooter to spawn projectile
}

// Helper function to create a weapon configuration
export function createWeaponConfig(
    overrides: Partial<WeaponConfigPreset> = {},
): WeaponComponent {
    return {
        type: 'weapon',
        lastShotTime: 0,
        ...autoTargetingCannonPreset,
        ...overrides,
    }
}

// Helper function to create an auto-targeting weapon configuration
export function createAutoTargetingWeaponConfig(
    overrides: Partial<WeaponConfigPreset> = {},
): WeaponComponent {
    return {
        type: 'weapon',
        lastShotTime: 0,
        ...autoTargetingCannonPreset,
        ...overrides,
    }
}
