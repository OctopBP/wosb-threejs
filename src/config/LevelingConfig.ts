import { ShipStats } from '../components/ShipStatsComponent';
import { VisualUpgrades } from '../components/VisualUpgradeComponent';

export interface LevelUpgrade {
    level: number;
    statModifiers: Partial<ShipStats>;
    visualUpgrades: Partial<VisualUpgrades>;
    description: string;
}

export interface ProgressionCurve {
    type: 'linear' | 'polynomial' | 'custom';
    baseXP: number;
    multiplier: number;
    exponent?: number; // For polynomial curves
    customThresholds?: number[]; // For custom curves
}

export const LEVELING_CONFIG = {
    maxLevel: 6,
    
    // Progression curve configuration
    progressionCurve: {
        type: 'polynomial' as const,
        baseXP: 100,
        multiplier: 1.5,
        exponent: 1.8
    } as ProgressionCurve,
    
    // Level-specific upgrades
    levelUpgrades: [
        {
            level: 1,
            statModifiers: {},
            visualUpgrades: {},
            description: 'Starting ship - Basic configuration'
        },
        {
            level: 2,
            statModifiers: {
                speed: 1,
                firepower: 2
            },
            visualUpgrades: {
                sailType: 1,
                hullColor: '#654321'
            },
            description: 'Enhanced sails and improved cannons'
        },
        {
            level: 3,
            statModifiers: {
                speed: 2,
                firepower: 4,
                maxHealth: 25
            },
            visualUpgrades: {
                cannonCount: 4,
                decorations: ['gilt_trim']
            },
            description: 'Additional cannons and reinforced hull'
        },
        {
            level: 4,
            statModifiers: {
                speed: 3,
                firepower: 6,
                maxHealth: 50,
                fireRate: 0.5
            },
            visualUpgrades: {
                sailType: 2,
                flagType: 1,
                decorations: ['gilt_trim', 'figurehead']
            },
            description: 'Elite sails and faster reload speed'
        },
        {
            level: 5,
            statModifiers: {
                speed: 5,
                firepower: 10,
                maxHealth: 80,
                fireRate: 1.0,
                range: 15
            },
            visualUpgrades: {
                cannonCount: 6,
                hullColor: '#2F4F4F',
                decorations: ['gilt_trim', 'figurehead', 'battle_scars']
            },
            description: 'Battle-hardened veteran ship'
        },
        {
            level: 6,
            statModifiers: {
                speed: 8,
                firepower: 15,
                maxHealth: 120,
                fireRate: 1.5,
                range: 25
            },
            visualUpgrades: {
                sailType: 3,
                cannonCount: 8,
                flagType: 2,
                hullColor: '#191970',
                decorations: ['gilt_trim', 'figurehead', 'battle_scars', 'admiral_flag']
            },
            description: 'Legendary Admiral Ship - Maximum power!'
        }
    ] as LevelUpgrade[]
};

export class LevelingCalculator {
    static calculateXPRequiredForLevel(level: number, curve: ProgressionCurve): number {
        if (level <= 1) return 0;
        
        switch (curve.type) {
            case 'linear':
                return curve.baseXP * (level - 1) * curve.multiplier;
                
            case 'polynomial':
                const exponent = curve.exponent || 2;
                return Math.floor(curve.baseXP * Math.pow((level - 1) * curve.multiplier, exponent));
                
            case 'custom':
                if (curve.customThresholds && level - 2 < curve.customThresholds.length) {
                    return curve.customThresholds[level - 2];
                }
                return curve.baseXP * (level - 1);
                
            default:
                return curve.baseXP * (level - 1);
        }
    }
    
    static getNextLevelThreshold(currentLevel: number): number {
        if (currentLevel >= LEVELING_CONFIG.maxLevel) {
            return Infinity;
        }
        return this.calculateXPRequiredForLevel(currentLevel + 1, LEVELING_CONFIG.progressionCurve);
    }
    
    static getLevelUpgrade(level: number): LevelUpgrade | undefined {
        return LEVELING_CONFIG.levelUpgrades.find(upgrade => upgrade.level === level);
    }
    
    static getAllThresholds(): number[] {
        const thresholds: number[] = [];
        for (let level = 1; level <= LEVELING_CONFIG.maxLevel; level++) {
            thresholds.push(this.calculateXPRequiredForLevel(level, LEVELING_CONFIG.progressionCurve));
        }
        return thresholds;
    }
}