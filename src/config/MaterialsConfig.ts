// Material configuration mapping
import type { MeshLambertMaterialParameters } from 'three'

export interface MaterialConfig {
    kind: 'material'
    parameters: MeshLambertMaterialParameters
    name: string
}

export const MATERIAL_CONFIGS: Record<string, MaterialConfig> = {
    projectile: {
        kind: 'material',
        name: 'projectile',
        parameters: {
            color: 0x000000, // Black color for projectiles
            transparent: false,
            depthWrite: true,
            depthTest: true,
        },
    },
    fallback: {
        kind: 'material',
        name: 'fallback',
        parameters: {
            color: 0xff00ff, // Magenta for missing models
            transparent: false,
            depthWrite: true,
            depthTest: true,
        },
    },
    enemy: {
        kind: 'material',
        name: 'enemy',
        parameters: {
            color: 0xff4444, // Red tint for enemies
            transparent: false,
            depthWrite: true,
            depthTest: true,
        },
    },
    player: {
        kind: 'material',
        name: 'player',
        parameters: {
            color: 0x4444ff, // Blue tint for player
            transparent: false,
            depthWrite: true,
            depthTest: true,
        },
    },
} as const

export type MaterialType = keyof typeof MATERIAL_CONFIGS

export function getMaterialConfig(materialType: MaterialType): MaterialConfig {
    return MATERIAL_CONFIGS[materialType]
}

export function getAllMaterialTypes(): MaterialType[] {
    return Object.keys(MATERIAL_CONFIGS) as MaterialType[]
}
