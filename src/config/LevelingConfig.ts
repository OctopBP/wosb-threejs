import type {
    LevelComponent,
    LevelingStatsComponent,
    XPComponent,
} from '../ecs/Component'

// XP progression configuration
export interface XPProgressionConfig {
    levelXpThresholds: number[]
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
}

// Default XP progression configuration for a 6-level system
export const defaultXPProgression: XPProgressionConfig = {
    levelXpThresholds: [0, 30, 60], // Level 2 after 1 enemy (30 XP), Level 3 after 3 more enemies (30 XP total)
}

// Enemy XP values configuration
export const enemyXPConfig: EnemyXPConfig = {
    basicEnemy: 30, // Each enemy gives 30 XP
}

// Default leveling stats configuration
export const defaultLevelingStats = {
    baseDamage: 25, // Level 1: 25 damage (enemy has 50 HP = 2 hits)
    damagePerLevel: 25, // Level 2: 50 damage (1 hit), Level 3: 75 damage (overkill for multiple targets)
    baseFireRate: 0.6, // Slower base fire rate for timing scenarios (1.67 shots per second)
    fireRatePerLevel: 0.2, // Level 2: 0.8 fire rate, Level 3: 1.0 fire rate
    baseMaxHealth: 60, // Lower base health to ensure damage before level-ups
    healthPerLevel: 20, // +20 max health per level (60 -> 80 -> 100)
    baseMaxSpeed: 2.5, // Slower than enemies initially
    speedPerLevel: 0.3, // Gradual speed increase per level
}

// Level-up animation configuration
export const levelUpAnimation: LevelUpAnimationConfig = {
    scaleDuration: 0.5,
    scaleMultiplier: 1.3,
    flashDuration: 0.3,
}

// Maximum level configuration
export const MAX_LEVEL = 3

// Helper functions for XP calculation
export function calculateXPThreshold(
    level: number,
    config: XPProgressionConfig = defaultXPProgression,
): number {
    if (level <= 1) {
        return 0
    }

    return config.levelXpThresholds[level - 1] ?? 0
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
