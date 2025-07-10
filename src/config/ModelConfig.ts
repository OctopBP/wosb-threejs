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
            fileName: 'pl_01.glb',
            scale: 0.5,
        },
        // Add primitive types for projectiles and obstacles
        sphere: {
            kind: 'primitive',
            scale: 1.0,
            primitive: 'sphere',
            options: { diameter: 0.2, segments: 8 },
        },
        box: {
            kind: 'primitive',
            scale: 1.0,
            primitive: 'box',
            options: { width: 1, height: 1, depth: 1 },
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
