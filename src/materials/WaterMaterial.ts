import type { Color } from 'three'
import { DoubleSide, ShaderMaterial } from 'three'
import type { WaterConfig } from '../config/WaterConfig'
import fragmentShader from '../shaders/water/fragment.glsl'
import vertexShader from '../shaders/water/vertex.glsl'

interface WaterMaterialOptions {
    waterLevel: number
    colorNear: Color
    colorFar: Color
    waveSpeed: number
    waveAmplitude: number
    textureSize: number
    foamDepth: number
}

export function createWaterMaterial(
    options: WaterMaterialOptions,
): ShaderMaterial {
    const material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uColorNear: { value: options.colorNear },
            uColorFar: { value: options.colorFar },
            uWaveSpeed: { value: options.waveSpeed },
            uWaveAmplitude: { value: options.waveAmplitude },
            uTextureSize: { value: options.textureSize },
            uWaterLevel: { value: options.waterLevel },
            uFoamThreshold: { value: 0.6 },
            uFoamDepth: { value: options.foamDepth },
        },
        transparent: true,
        side: DoubleSide,
    })

    return material
}

export function createWaterMaterialFromConfig(
    config: WaterConfig,
): ShaderMaterial {
    return createWaterMaterial({
        waterLevel: config.waterLevel,
        colorNear: config.colorNear,
        colorFar: config.colorFar,
        waveSpeed: config.waveSpeed,
        waveAmplitude: config.waveAmplitude,
        textureSize: config.textureSize,
        foamDepth: config.foamDepth,
    })
}
