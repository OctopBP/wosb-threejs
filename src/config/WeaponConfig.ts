import type { WeaponComponent } from '../ecs/Component'

export type WeaponConfigPreset = Omit<WeaponComponent, 'type' | 'lastShotTime'>

// Basic cannon configuration for player ship
export const basicCannonPreset: WeaponConfigPreset = {
    damage: 25,
    fireRate: 0.75, // Every 1.5 seconds (1/0.75 shots per second)
    projectileSpeed: 10.0,
    range: 15.0,
    projectileType: 'sphere',
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
        ...basicCannonPreset,
        ...overrides,
    }
}
