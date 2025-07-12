// Simplified perlin noise function for water effects
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
    
    // Dynamic wave threshold for animated patterns
    float threshold = uFoamThreshold + 0.01 * sin(uTime * 2.0);
    vec3 waveEffect = 1.0 - (smoothstep(threshold + 0.03, threshold + 0.032, colorWaves) + 
                           smoothstep(threshold, threshold - 0.01, colorWaves));
    
    // Make wave pattern more defined
    waveEffect = step(0.5, waveEffect);
    
    // Combine wave and foam effects
    vec3 combinedEffect = min(waveEffect + foam, 1.0);
    
    // Create gradient based on distance from center for depth effect
    float vignette = length(vUv - 0.5) * 1.5;
    vec3 baseEffect = smoothstep(0.1, 0.3, vec3(vignette));
    
    // Mix near and far water colors based on distance
    vec3 baseColor = mix(uColorNear, uColorFar, baseEffect);
    
    // Apply effects to reduce based on distance
    combinedEffect = mix(combinedEffect, vec3(0.0), baseEffect);
    
    // Foam effect for alpha calculation
    vec3 foamEffect = mix(foam, vec3(0.0), baseEffect);
    
    // Calculate final color
    vec3 finalColor = (1.0 - combinedEffect) * baseColor + combinedEffect;
    
    // Create foam around water level (intersection foam effect)
    float currentWaterHeight = uWaterLevel + sin(uTime * uWaveSpeed) * uWaveAmplitude;
    float foamStripe = smoothstep(currentWaterHeight + 0.01, currentWaterHeight - 0.01, vPositionW.y)
                     - smoothstep(currentWaterHeight + uFoamDepth + 0.01, currentWaterHeight + uFoamDepth - 0.01, vPositionW.y);
    
    // Add foam stripe to final color
    finalColor = mix(finalColor, vec3(1.0), foamStripe * 0.8);
    
    // Alpha management for transparency and depth
    alpha = mix(0.4, 1.0, foamEffect.x);
    alpha = mix(alpha, 0.8, vignette + 0.2);
    alpha = max(alpha, foamStripe * 0.9);
    
    gl_FragColor = vec4(finalColor, alpha);
}