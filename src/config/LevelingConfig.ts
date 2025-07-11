import type {
    LevelComponent,
    LevelingStatsComponent,
    XPComponent,
} from '../ecs/Component'

// Progression curve types
export type ProgressionCurveType =
    | 'linear'
    | 'polynomial'
    | 'exponential'
    | 'custom'

// XP progression configuration
export interface XPProgressionConfig {
    curveType: ProgressionCurveType
    baseXP: number // XP required for level 2
    multiplier: number // Multiplier for polynomial/exponential curves
    customThresholds?: number[] // Custom XP thresholds for each level
}

// Enemy XP values
export interface EnemyXPConfig {
    basicEnemy: number
    // Future enemy types can be added here
}

// Visual upgrade configuration per level
export interface VisualUpgradeConfig {
    level: number
    sails?: {
        color?: string
        texture?: string
    }
    cannons?: {
        count?: number
        size?: number
    }
    hull?: {
        color?: string
        metallic?: number
        roughness?: number
    }
    effects?: {
        glowIntensity?: number
        particleEffects?: string[]
    }
}

// Level-up animation configuration
export interface LevelUpAnimationConfig {
    scaleDuration: number // Duration of scale animation in seconds
    scaleMultiplier: number // How much to scale up (e.g., 1.2 = 20% larger)
    flashDuration: number // Duration of flash effect in seconds
    flashColor: string // Color of flash effect
}

// Default XP progression configuration for a 6-level system
export const defaultXPProgression: XPProgressionConfig = {
    curveType: 'polynomial',
    baseXP: 100, // Level 2 requires 100 XP
    multiplier: 1.5, // Each level requires 1.5x more XP than the previous
    // Custom progression: [0, 100, 250, 450, 750, 1200, 2000] for levels 1-6
    customThresholds: [0, 100, 250, 450, 750, 1200, 2000],
}

// Enemy XP values configuration
export const enemyXPConfig: EnemyXPConfig = {
    basicEnemy: 25, // Each basic enemy gives 25 XP
}

// Default leveling stats configuration
export const defaultLevelingStats = {
    baseDamage: 25,
    damagePerLevel: 5, // +5 damage per level
    baseFireRate: 1.0,
    fireRatePerLevel: 0.1, // +0.1 fire rate per level
    baseMaxHealth: 100,
    healthPerLevel: 20, // +20 max health per level
    baseMaxSpeed: 4.0,
    speedPerLevel: 0.5, // +0.5 speed per level
}

// Visual upgrades per level configuration
export const visualUpgrades: VisualUpgradeConfig[] = [
    { level: 1 }, // Base level, no upgrades
    {
        level: 2,
        sails: { color: '#4a90e2' },
        hull: { metallic: 0.2 },
    },
    {
        level: 3,
        cannons: { count: 2, size: 1.1 },
        hull: { color: '#2c5aa0', metallic: 0.4 },
    },
    {
        level: 4,
        sails: { color: '#6b5b95' },
        hull: { metallic: 0.6 },
        effects: { glowIntensity: 0.3 },
    },
    {
        level: 5,
        cannons: { count: 3, size: 1.2 },
        hull: { color: '#88398a', metallic: 0.8 },
        effects: { glowIntensity: 0.5 },
    },
    {
        level: 6,
        sails: { color: '#c06c84' },
        cannons: { count: 4, size: 1.3 },
        hull: { color: '#d4af37', metallic: 1.0 },
        effects: { glowIntensity: 0.8, particleEffects: ['sparkles'] },
    },
]

// Level-up animation configuration
export const levelUpAnimation: LevelUpAnimationConfig = {
    scaleDuration: 0.5,
    scaleMultiplier: 1.3,
    flashDuration: 0.3,
    flashColor: '#ffd700', // Gold color
}

// Maximum level configuration
export const MAX_LEVEL = 6

// Helper functions for XP calculation
export function calculateXPThreshold(
    level: number,
    config: XPProgressionConfig = defaultXPProgression,
): number {
    if (level <= 1) return 0

    switch (config.curveType) {
        case 'linear':
            return config.baseXP * (level - 1)

        case 'polynomial':
            return Math.floor(config.baseXP * (level - 1) ** config.multiplier)

        case 'exponential':
            return Math.floor(config.baseXP * config.multiplier ** (level - 2))

        case 'custom':
            if (
                config.customThresholds &&
                config.customThresholds[level - 1] !== undefined
            ) {
                return config.customThresholds[level - 1]
            }
            // Fall back to polynomial if custom threshold not found
            return Math.floor(config.baseXP * (level - 1) ** config.multiplier)

        default:
            return Math.floor(config.baseXP * (level - 1) ** config.multiplier)
    }
}

export function calculateNextLevelXP(
    currentLevel: number,
    config: XPProgressionConfig = defaultXPProgression,
): number {
    if (currentLevel >= MAX_LEVEL) return Number.MAX_SAFE_INTEGER
    return calculateXPThreshold(currentLevel + 1, config)
}

export function getXPForLevel(
    level: number,
    config: XPProgressionConfig = defaultXPProgression,
): number {
    return calculateXPThreshold(level, config)
}

// Helper functions to create leveling components
export function createXPComponent(): XPComponent {
    return {
        type: 'xp',
        currentXP: 0,
        totalXP: 0,
    }
}

export function createLevelComponent(): LevelComponent {
    return {
        type: 'level',
        currentLevel: 1,
        maxLevel: MAX_LEVEL,
        hasLeveledUp: false,
        levelUpTime: 0,
    }
}

export function createLevelingStatsComponent(
    overrides: Partial<Omit<LevelingStatsComponent, 'type'>> = {},
): LevelingStatsComponent {
    return {
        type: 'levelingStats',
        ...defaultLevelingStats,
        ...overrides,
    }
}
