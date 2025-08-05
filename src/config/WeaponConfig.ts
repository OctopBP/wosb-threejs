import type { WeaponComponent } from '../ecs/Component'

export type WeaponConfigPreset = Omit<
    WeaponComponent,
    'type' | 'lastShotTime'
> & {}

export const playerWeaponPreset: WeaponConfigPreset = {
    damage: 25, // Will be overridden by leveling system
    fireRate: 0.7, // Matches leveling config base fire rate (1.42 shots/sec)
    projectileSpeed: 30.0, // Faster projectiles for better combat feel
    range: 20.0, // Good range for engagement
    projectileType: 'bullet',
    isAutoTargeting: true,
    detectionRange: 15.0, // Good detection range
    requiresLineOfSight: false,
    leadTargetDistance: 1.5, // Aim 1.5 units in front of enemy ships
    shootingPoints: [
        { x: -0.3, y: 0.8 },
        { x: 0.3, y: 0.8 },
        { x: -0.4, y: -0.5 },
        { x: 0.4, y: -0.5 },
    ],
}

export const enemyWeaponPreset: WeaponConfigPreset = {
    damage: 15, // Balanced to bring player to 20-60% health before level-ups
    fireRate: 0.7, // Slightly faster than player initially
    projectileSpeed: 24.0, // Slower than player projectiles
    range: 25.0, // Shorter range than player
    projectileType: 'bullet',
    isAutoTargeting: true,
    detectionRange: 15.0, // Shorter detection range
    requiresLineOfSight: false,
    leadTargetDistance: 1.0, // Aim 1.0 units in front of player ship
    shootingPoints: [
        { x: -0.4, y: 0.8 },
        { x: 0.4, y: 0.8 },
        { x: -0.4, y: -0.5 },
        { x: 0.4, y: -0.5 },
    ],
}

export const bossWeaponPreset: WeaponConfigPreset = {
    damage: 40,
    fireRate: 1.2,
    projectileSpeed: 35.0,
    range: 18.0, // Long range
    projectileType: 'homing',
    isAutoTargeting: true,
    detectionRange: 20.0, // Very long detection range
    requiresLineOfSight: false,
    leadTargetDistance: 1.0, // Aim 1.0 units in front of player ship for better boss accuracy
    homingStrength: 1.0, // 100% homing strength - no dodging
    homingRange: 15.0, // Can track targets within 15 units
    homingUpdateInterval: 0.1, // Update targeting 10 times per second
    homingTurnRate: Math.PI * 1.5, // Can turn up to 270 degrees per second
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
        { x: 0, y: 0 },
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
