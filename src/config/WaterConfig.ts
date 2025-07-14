export interface WaterConfig {
    size: number
    segments: number
    waveHeight: number
    waveSpeed: number
    waveDirection: { x: number; y: number }
    color: number
    waterNormals: string
    sunDirection: { x: number; y: number; z: number }
    sunColor: number
    waterColor: number
    distortionScale: number
    fog: boolean
    foamIntensity: number
    transparency: number
}

export interface IslandConfig {
    count: number
    scale: { min: number; max: number }
    position: { 
        radius: { min: number; max: number }
        height: { min: number; max: number }
    }
    geometry: 'box' | 'cylinder' | 'sphere'
    material: {
        color: number
        roughness: number
        metalness: number
    }
}

export interface DebrisConfig {
    count: number
    scale: { min: number; max: number }
    position: {
        radius: { min: number; max: number }
        height: { min: number; max: number }
    }
    types: Array<{
        geometry: 'box' | 'cylinder' | 'sphere'
        probability: number
        material: {
            color: number
            roughness: number
            metalness: number
        }
    }>
    movement: {
        bobbing: {
            amplitude: number
            speed: number
        }
        drift: {
            speed: number
            direction: { x: number; y: number }
        }
    }
}

export const DEFAULT_WATER_CONFIG: WaterConfig = {
    size: 1000,
    segments: 128,
    waveHeight: 20,
    waveSpeed: 0.5,
    waveDirection: { x: 1, y: 0 },
    color: 0x006994,
    waterNormals: '/normal.jpg',
    sunDirection: { x: 0.70707, y: 0.70707, z: 0 },
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 20.0,
    fog: true,
    foamIntensity: 0.1,
    transparency: 0.8,
}

export const DEFAULT_ISLAND_CONFIG: IslandConfig = {
    count: 8,
    scale: { min: 15, max: 40 },
    position: {
        radius: { min: 200, max: 450 },
        height: { min: 5, max: 25 }
    },
    geometry: 'cylinder',
    material: {
        color: 0x4a5d23,
        roughness: 0.8,
        metalness: 0.1
    }
}

export const DEFAULT_DEBRIS_CONFIG: DebrisConfig = {
    count: 20,
    scale: { min: 2, max: 8 },
    position: {
        radius: { min: 50, max: 300 },
        height: { min: 0.5, max: 2 }
    },
    types: [
        {
            geometry: 'box',
            probability: 0.4,
            material: {
                color: 0x8b4513,
                roughness: 0.9,
                metalness: 0.1
            }
        },
        {
            geometry: 'cylinder',
            probability: 0.3,
            material: {
                color: 0x654321,
                roughness: 0.8,
                metalness: 0.2
            }
        },
        {
            geometry: 'sphere',
            probability: 0.3,
            material: {
                color: 0x2f4f2f,
                roughness: 0.7,
                metalness: 0.0
            }
        }
    ],
    movement: {
        bobbing: {
            amplitude: 0.5,
            speed: 1.2
        },
        drift: {
            speed: 0.1,
            direction: { x: 0.3, y: 0.7 }
        }
    }
}

export function getWaterConfig(): WaterConfig {
    return { ...DEFAULT_WATER_CONFIG }
}

export function getIslandConfig(): IslandConfig {
    return { ...DEFAULT_ISLAND_CONFIG }
}

export function getDebrisConfig(): DebrisConfig {
    return { ...DEFAULT_DEBRIS_CONFIG }
}