// Model configuration mapping
import type { MaterialType } from './MaterialsConfig'

export interface ModelConfig {
    kind: 'model'
    fileName: string
    scale: number
    materialRef?: MaterialType // Reference to material configuration
}

export interface PrimitiveModelConfig {
    kind: 'primitive'
    scale: number
    primitive: string
    options: Record<string, number>
    materialRef?: MaterialType // Reference to material configuration
}

export const MODEL_CONFIGS: Record<string, ModelConfig | PrimitiveModelConfig> =
    {
        ship_lvl_1: {
            kind: 'model',
            fileName: 'ship_lvl_1.glb',
            scale: 0.75,
            materialRef: 'player',
        },
        ship_lvl_2: {
            kind: 'model',
            fileName: 'ship_lvl_2.glb',
            scale: 0.75,
            materialRef: 'player',
        },
        ship_lvl_3: {
            kind: 'model',
            fileName: 'ship_lvl_3.glb',
            scale: 0.75,
            materialRef: 'player',
        },
        // Legacy ship alias for backward compatibility
        ship: {
            kind: 'model',
            fileName: 'ship_lvl_1.glb',
            scale: 0.75,
            materialRef: 'player',
        },
        // Add primitive types for projectiles and obstacles
        enemy1: {
            kind: 'model',
            fileName: 'ship_lvl_2.glb',
            scale: 0.75,
            materialRef: 'enemy',
        },
        boss: {
            kind: 'model',
            fileName: 'boss.glb',
            scale: 0.5,
            materialRef: 'enemy',
        },
        island: {
            kind: 'model',
            fileName: 'islands_exp_test.glb',
            scale: 1.0,
        },
        bullet: {
            kind: 'primitive',
            scale: 0.75,
            primitive: 'sphere',
            options: { diameter: 0.2, segments: 8 },
            materialRef: 'projectile',
        },
    } as const

export type ModelType = keyof typeof MODEL_CONFIGS

export function getModelConfig(modelType: ModelType) {
    return MODEL_CONFIGS[modelType]
}

export function isPrimitiveModel(modelType: ModelType): boolean {
    const config = MODEL_CONFIGS[modelType]
    return config.kind === 'primitive'
}

/**
 * Get the appropriate ship model type based on player level
 * @param level Player level (1-6)
 * @returns ModelType for the appropriate ship model
 */
export function getShipModelForLevel(level: number): ModelType {
    if (level >= 3) {
        return 'ship_lvl_3'
    } else if (level >= 2) {
        return 'ship_lvl_2'
    } else {
        return 'ship_lvl_1'
    }
}
