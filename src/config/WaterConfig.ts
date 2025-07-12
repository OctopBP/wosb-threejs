import { Color } from 'three'

export interface WaterConfig {
    // Water appearance
    colorNear: Color
    colorFar: Color
    waterLevel: number

    // Wave animation
    waveSpeed: number
    waveAmplitude: number

    // Foam and texture
    textureSize: number
    foamDepth: number
    foamThreshold: number

    // Performance
    geometrySegments: number
    waterSize: number
}

export const defaultWaterConfig: WaterConfig = {
    // Cartoon-style blue water colors
    colorNear: new Color('#00fccd'), // Bright cyan near shore
    colorFar: new Color('#0066cc'), // Deep blue in distance
    waterLevel: 0.8,

    // Wave animation settings
    waveSpeed: 1.2,
    waveAmplitude: 0.1,

    // Foam and texture parameters
    textureSize: 50, // Controls noise scale (lower = larger patterns)
    foamDepth: 0.08, // Height of foam around objects
    foamThreshold: 0.6, // Threshold for foam generation

    // Performance settings
    geometrySegments: 128, // Water plane subdivision
    waterSize: 200, // Size of water plane
}

// Preset configurations for different styles
export const waterPresets = {
    // Calm, peaceful water
    calm: {
        ...defaultWaterConfig,
        waveSpeed: 0.8,
        waveAmplitude: 0.05,
        textureSize: 60,
    },

    // Rough, stormy water
    rough: {
        ...defaultWaterConfig,
        waveSpeed: 2.0,
        waveAmplitude: 0.2,
        textureSize: 30,
        foamDepth: 0.12,
    },

    // Tropical, clear water
    tropical: {
        ...defaultWaterConfig,
        colorNear: new Color('#00ffff'),
        colorFar: new Color('#0088ff'),
        waveSpeed: 1.0,
        waveAmplitude: 0.08,
        textureSize: 70,
    },
}
