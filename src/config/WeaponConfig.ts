import type { WeaponComponent } from '../ecs/Component'

export type WeaponConfigPreset = Omit<WeaponComponent, 'type' | 'lastShotTime'>

export const playerWeaponPreset: WeaponConfigPreset = {
    damage: 25, // Will be overridden by leveling system
    fireRate: 0.6, // Matches leveling config base fire rate (1.67 shots/sec)
    projectileSpeed: 20.0, // Faster projectiles for better combat feel
    range: 12.0, // Good range for engagement
    projectileType: 'bullet',
    isAutoTargeting: true,
    detectionRange: 10.0, // Good detection range
    requiresLineOfSight: false,
    shootingPoints: [
        { x: -0.15, y: 0.4 },
        { x: 0.15, y: 0.4 },
        { x: -0.2, y: -0.25 },
        { x: 0.2, y: -0.25 },
    ],
}

export const enemyWeaponPreset: WeaponConfigPreset = {
    damage: 15, // Balanced to bring player to 20-60% health before level-ups
    fireRate: 0.7, // Slightly faster than player initially
    projectileSpeed: 12.0, // Slower than player projectiles
    range: 10.0, // Shorter range than player
    projectileType: 'bullet',
    isAutoTargeting: true,
    detectionRange: 8.0, // Shorter detection range
    requiresLineOfSight: false,
    shootingPoints: [
        { x: -0.2, y: 0.4 },
        { x: 0.2, y: 0.4 },
        { x: -0.2, y: -0.25 },
        { x: 0.2, y: -0.25 },
    ],
}

export const bossWeaponPreset: WeaponConfigPreset = {
    damage: 30, // High damage to significantly lower player health
    fireRate: 1.2, // Fast fire rate
    projectileSpeed: 25.0,
    range: 18.0, // Long range
    projectileType: 'bullet',
    isAutoTargeting: true,
    detectionRange: 20.0, // Very long detection range
    requiresLineOfSight: false,
    shootingPoints: [
        { x: -0.4, y: 2 },
        { x: 0.4, y: 2 },
        { x: -0.5, y: 1 },
        { x: 0.5, y: 1 },
        { x: -0.6, y: 0 },
        { x: 0.6, y: 0 },
        { x: -0.45, y: -1 },
        { x: 0.45, y: -1 },
        { x: 0, y: -2 },
    ],
}

export const projectilePhysicsConfig = {
    gravity: -9.8,
    upwardVelocity: 2.0,
    heightOffset: 0.2,
    forwardOffset: 0,
}

export function createPlayerWeaponConfig(
    overrides: Partial<WeaponConfigPreset> = {},
): WeaponComponent {
    return {
        type: 'weapon',
        lastShotTime: 0,
        ...playerWeaponPreset,
        ...overrides,
    }
}

export function createEnemyWeaponConfig(
    overrides: Partial<WeaponConfigPreset> = {},
): WeaponComponent {
    return {
        type: 'weapon',
        lastShotTime: 0,
        ...enemyWeaponPreset,
        ...overrides,
    }
}

export function createBossWeaponConfig(
    overrides: Partial<WeaponConfigPreset> = {},
): WeaponComponent {
    return {
        type: 'weapon',
        lastShotTime: 0,
        ...bossWeaponPreset,
        ...overrides,
    }
}
