import type { Color } from 'three'
import { DoubleSide, ShaderMaterial } from 'three'

interface WaterMaterialOptions {
    waterLevel: number
    colorNear: Color
    colorFar: Color
    waveSpeed: number
    waveAmplitude: number
    textureSize: number
    foamDepth: number
}

// Perlin noise function - simplified version for water effects
const perlinNoise = `
    // Simplified perlin noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
`

// Vertex shader for water surface with wave animation
const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPositionW;
    
    uniform float uTime;
    uniform float uWaveSpeed;
    uniform float uWaveAmplitude;
    
    void main() {
        vUv = uv;
        
        // Calculate world position for foam effects
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vPositionW = worldPosition.xyz;
        
        // Create wave animation using sine functions
        vec3 modifiedPosition = position;
        
        // Primary wave motion
        float sineOffset = sin(uTime * uWaveSpeed) * uWaveAmplitude;
        modifiedPosition.z += sineOffset;
        
        // Add secondary wave details
        float wave1 = sin(position.x * 0.1 + uTime * uWaveSpeed * 0.8) * uWaveAmplitude * 0.5;
        float wave2 = sin(position.y * 0.15 + uTime * uWaveSpeed * 0.6) * uWaveAmplitude * 0.3;
        modifiedPosition.z += wave1 + wave2;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(modifiedPosition, 1.0);
    }
`

// Fragment shader for cartoon-style water with foam effects
const fragmentShader = `
    ${perlinNoise}
    
    varying vec2 vUv;
    varying vec3 vPositionW;
    
    uniform float uTime;
    uniform vec3 uColorNear;
    uniform vec3 uColorFar;
    uniform float uTextureSize;
    uniform float uWaterLevel;
    uniform float uWaveSpeed;
    uniform float uWaveAmplitude;
    uniform float uFoamThreshold;
    uniform float uFoamDepth;
    
    void main() {
        // Set initial alpha
        float alpha = 0.8;
        
        // Invert texture size for noise scale
        float textureSize = 100.0 - uTextureSize;
        
        // Generate noise for foam texture
        float noiseBase = snoise(vUv * (textureSize * 2.8) + sin(uTime * 0.3));
        noiseBase = noiseBase * 0.5 + 0.5;
        vec3 colorBase = vec3(noiseBase);
        
        // Create foam effect using smoothstep and thresholding
        vec3 foam = smoothstep(0.08, 0.001, colorBase);
        foam = step(0.5, foam);
        
        // Generate wave pattern noise
        float noiseWaves = snoise(vUv * textureSize + sin(uTime * -0.1));
        noiseWaves = noiseWaves * 0.5 + 0.5;
        vec3 colorWaves = vec3(noiseWaves);
        
        // Dynamic wave threshold
        float threshold = uFoamThreshold + 0.01 * sin(uTime * 2.0);
        vec3 waveEffect = 1.0 - (smoothstep(threshold + 0.03, threshold + 0.032, colorWaves) + 
                               smoothstep(threshold, threshold - 0.01, colorWaves));
        
        // Make wave pattern more defined
        waveEffect = step(0.5, waveEffect);
        
        // Combine wave and foam effects
        vec3 combinedEffect = min(waveEffect + foam, 1.0);
        
        // Create gradient based on distance from center
        float vignette = length(vUv - 0.5) * 1.5;
        vec3 baseEffect = smoothstep(0.1, 0.3, vec3(vignette));
        vec3 baseColor = mix(uColorNear, uColorFar, baseEffect);
        
        // Apply effects to reduce based on distance
        combinedEffect = mix(combinedEffect, vec3(0.0), baseEffect);
        
        // Foam effect for alpha
        vec3 foamEffect = mix(foam, vec3(0.0), baseEffect);
        
        // Calculate final color
        vec3 finalColor = (1.0 - combinedEffect) * baseColor + combinedEffect;
        
        // Create foam around water level (intersection foam)
        float currentWaterHeight = uWaterLevel + sin(uTime * uWaveSpeed) * uWaveAmplitude;
        float foamStripe = smoothstep(currentWaterHeight + 0.01, currentWaterHeight - 0.01, vPositionW.y)
                         - smoothstep(currentWaterHeight + uFoamDepth + 0.01, currentWaterHeight + uFoamDepth - 0.01, vPositionW.y);
        
        // Add foam stripe to final color
        finalColor = mix(finalColor, vec3(1.0), foamStripe * 0.8);
        
        // Alpha management
        alpha = mix(0.4, 1.0, foamEffect.x);
        alpha = mix(alpha, 0.8, vignette + 0.2);
        alpha = max(alpha, foamStripe * 0.9);
        
        gl_FragColor = vec4(finalColor, alpha);
    }
`

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
