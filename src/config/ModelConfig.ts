export interface ModelConfig {
    fileName: string
    scale: number
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
    ship: {
        fileName: 'Player_grade01.glb',
        scale: 0.5,
    },
}

export function getModelConfig(meshType: string): ModelConfig {
    return MODEL_CONFIGS[meshType] || MODEL_CONFIGS.ship
}
