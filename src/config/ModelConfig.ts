export interface ModelConfig {
    fileName: string
    scale: number
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
    ship: {
        fileName: 'pl_01.glb',
        scale: 1,
    },
}

export function getModelConfig(meshType: string): ModelConfig {
    return MODEL_CONFIGS[meshType] || MODEL_CONFIGS.ship
}
