import type { WeaponComponent } from '../ecs/Component'

export type WeaponConfigPreset = Omit<WeaponComponent, 'type' | 'lastShotTime'>

export const playerWeaponPreset: WeaponConfigPreset = {
    damage: 25,
    fireRate: 1.0,
    projectileSpeed: 30.0,
    range: 20.0,
    projectileType: 'bullet',
    isAutoTargeting: true,
    detectionRange: 16.0,
    requiresLineOfSight: false,
    shootingPoints: [
        { x: -0.3, y: 0.8 },
        { x: 0.3, y: 0.8 },
        { x: -0.4, y: -0.5 },
        { x: 0.4, y: -0.5 },
    ],
}

export const enemyWeaponPreset: WeaponConfigPreset = {
    damage: 10,
    fireRate: 0.8,
    projectileSpeed: 20.0,
    range: 24.0,
    projectileType: 'bullet',
    isAutoTargeting: true,
    detectionRange: 20.0,
    requiresLineOfSight: false,
    shootingPoints: [
        { x: -0.4, y: 0.8 },
        { x: 0.4, y: 0.8 },
        { x: -0.4, y: -0.5 },
        { x: 0.4, y: -0.5 },
    ],
}

export const bossWeaponPreset: WeaponConfigPreset = {
    damage: 50,
    fireRate: 1.5,
    projectileSpeed: 25.0,
    range: 15.0,
    projectileType: 'bullet',
    isAutoTargeting: true,
    detectionRange: 18.0,
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
