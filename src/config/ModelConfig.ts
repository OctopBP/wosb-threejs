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
            fileName: 'ship_lvl_1.glb',
            scale: 0.75,
        },
        // Add primitive types for projectiles and obstacles
        enemy1: {
            kind: 'model',
            fileName: 'ship_lvl_2.glb',
            scale: 0.75,
        },
        boss: {
            kind: 'model',
            fileName: 'boss.glb',
            scale: 0.5,
        },
        bullet: {
            kind: 'primitive',
            scale: 0.75,
            primitive: 'sphere',
            options: { diameter: 0.2, segments: 8 },
        },
        barrel: {
            kind: 'model',
            fileName: 'barrel.glb',
            scale: 1.5,
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
