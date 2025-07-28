import type { HomingProjectileComponent } from '../ecs/Component'

export type HomingProjectileConfigPreset = Omit<
    HomingProjectileComponent,
    'type' | 'targetId' | 'lastUpdateTime'
>

// Boss homing projectile configuration - moderate homing for balanced gameplay
export const bossHomingProjectilePreset: HomingProjectileConfigPreset = {
    homingStrength: 0.7, // 70% homing strength - strong but not impossible to dodge
    homingRange: 15.0, // Can track targets within 15 units
    updateInterval: 0.1, // Update target tracking 10 times per second
    maxTurnRate: Math.PI * 1.5, // Can turn up to 270 degrees per second
    targetType: 'player', // Boss projectiles target the player
}

// More aggressive homing for late-game boss phases (if needed)
export const aggressiveHomingProjectilePreset: HomingProjectileConfigPreset = {
    homingStrength: 0.9, // 90% homing strength - very aggressive
    homingRange: 20.0, // Longer tracking range
    updateInterval: 0.05, // Update target tracking 20 times per second
    maxTurnRate: Math.PI * 2.0, // Can turn up to 360 degrees per second
    targetType: 'player',
}

// Weak homing for regular enemies (if we want to add it later)
export const enemyHomingProjectilePreset: HomingProjectileConfigPreset = {
    homingStrength: 0.4, // 40% homing strength - mild course correction
    homingRange: 10.0, // Shorter tracking range
    updateInterval: 0.2, // Update target tracking 5 times per second
    maxTurnRate: Math.PI * 1.0, // Can turn up to 180 degrees per second
    targetType: 'player',
}

export function createHomingProjectileConfig(
    preset: HomingProjectileConfigPreset,
    overrides: Partial<HomingProjectileConfigPreset> = {},
): HomingProjectileComponent {
    return {
        type: 'homingProjectile',
        targetId: null,
        lastUpdateTime: 0,
        ...preset,
        ...overrides,
    }
}
