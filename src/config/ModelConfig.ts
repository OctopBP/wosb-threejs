// Model configuration mapping
export interface ModelConfig {
    kind: 'model'
    fileName: string
    scale: number
}

export interface PrimitiveModelConfig {
    kind: 'primitive'
    scale: number
    primitive: string
    options: Record<string, number>
}

export const MODEL_CONFIGS: Record<string, ModelConfig | PrimitiveModelConfig> =
    {
        ship: {
            kind: 'model',
            fileName: 'player_export.glb',
            scale: 0.75,
        },
        // Add primitive types for projectiles and obstacles
        enemy1: {
            kind: 'model',
            fileName: 'enemy_01.glb',
            scale: 0.75,
        },
        boss: {
            kind: 'model',
            fileName: 'boss.glb',
            scale: 0.5,
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
