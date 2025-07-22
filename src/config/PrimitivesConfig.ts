// Primitive configuration mapping
export interface PrimitiveConfig {
    name: string
    type: 'primitive'
    shape: 'sphere' | 'box' | 'cylinder' | 'cone'
    options: Record<string, number>
}

export const PRIMITIVE_CONFIGS: Record<string, PrimitiveConfig> = {
    projectile: {
        name: 'projectile',
        type: 'primitive',
        shape: 'sphere',
        options: {
            diameter: 0.2,
            segments: 8,
        },
    },
    obstacle: {
        name: 'obstacle',
        type: 'primitive',
        shape: 'box',
        options: {
            width: 1.0,
            height: 1.0,
            depth: 1.0,
        },
    },
    marker: {
        name: 'marker',
        type: 'primitive',
        shape: 'cylinder',
        options: {
            radiusTop: 0.5,
            radiusBottom: 0.5,
            height: 1.0,
            segments: 8,
        },
    },
    debris: {
        name: 'debris',
        type: 'primitive',
        shape: 'box',
        options: {
            width: 0.5,
            height: 0.3,
            depth: 0.7,
        },
    },
    beacon: {
        name: 'beacon',
        type: 'primitive',
        shape: 'cone',
        options: {
            radius: 0.3,
            height: 1.2,
            segments: 12,
        },
    },
} as const

export type PrimitiveType = keyof typeof PRIMITIVE_CONFIGS

export function getPrimitiveConfig(
    primitiveType: PrimitiveType,
): PrimitiveConfig {
    return PRIMITIVE_CONFIGS[primitiveType]
}

export function getAllPrimitiveTypes(): PrimitiveType[] {
    return Object.keys(PRIMITIVE_CONFIGS) as PrimitiveType[]
}

export function isPrimitiveType(type: string): type is PrimitiveType {
    return type in PRIMITIVE_CONFIGS
}

/**
 * Helper function to get all primitives of a specific shape
 */
export function getPrimitivesByShape(
    shape: PrimitiveConfig['shape'],
): PrimitiveConfig[] {
    return Object.values(PRIMITIVE_CONFIGS).filter(
        (config) => config.shape === shape,
    )
}

/**
 * Helper function to create a new primitive configuration
 */
export function createPrimitiveConfig(
    name: string,
    shape: PrimitiveConfig['shape'],
    options: Record<string, number>,
): PrimitiveConfig {
    return {
        name,
        type: 'primitive',
        shape,
        options,
    }
}
