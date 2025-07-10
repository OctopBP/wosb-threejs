// Model configuration mapping
export const MODEL_CONFIGS = {
    ship: {
        fileName: 'pl_01.glb',
        scale: 0.5,
    },
    // Add primitive types for projectiles and obstacles
    sphere: {
        fileName: '', // Empty for primitives
        scale: 1.0,
        primitive: 'sphere',
        options: { diameter: 0.2, segments: 8 },
    },
    box: {
        fileName: '', // Empty for primitives
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
    return 'primitive' in config && config.primitive !== undefined
}
