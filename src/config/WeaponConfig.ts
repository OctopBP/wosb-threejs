import type { WeaponComponent } from '../ecs/Component'

export type WeaponConfigPreset = Omit<WeaponComponent, 'type' | 'lastShotTime'>

// Basic cannon configuration for player ship
export const basicCannonPreset: WeaponConfigPreset = {
    damage: 25,
    fireRate: 0.33, // Every 3 seconds (1/3 shots per second)
    projectileSpeed: 10.0,
    range: 15.0,
    projectileType: 'sphere',
}

// Fast cannon configuration (for future use)
export const fastCannonPreset: WeaponConfigPreset = {
    damage: 15,
    fireRate: 1.0, // 1 shot per second
    projectileSpeed: 12.0,
    range: 12.0,
    projectileType: 'sphere',
}

// Heavy cannon configuration (for future use)
export const heavyCannonPreset: WeaponConfigPreset = {
    damage: 50,
    fireRate: 0.2, // Every 5 seconds
    projectileSpeed: 8.0,
    range: 20.0,
    projectileType: 'sphere',
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
