varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

uniform float uDissolveAmount; // 0.0 = no dissolve, 1.0 = fully dissolved
uniform float uEdgeWidth; // Width of the glowing edge
uniform vec3 uEdgeColor; // Color of the dissolve edge
uniform vec3 uBaseColor; // Base material color
uniform float uOpacity; // Overall opacity
uniform float uTime; // Time for animation

// Simple noise function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Noise function using random
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal Brownian Motion for more complex noise
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 2.0;
    
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value;
}

void main() {
    // Generate noise pattern for dissolve
    vec2 noiseUV = vUv * 3.0 + uTime * 0.1; // Add slight movement
    float noiseValue = fbm(noiseUV);
    
    // Add vertical gradient to make dissolution start from bottom
    float verticalGradient = 1.0 - (vPosition.y + 2.0) * 0.25; // Adjust based on ship size
    float dissolvePattern = mix(noiseValue, verticalGradient, 0.6);
    
    // Calculate dissolve threshold
    float dissolveThreshold = uDissolveAmount;
    
    // Discard pixels that should be dissolved
    if (dissolvePattern < dissolveThreshold) {
        discard;
    }
    
    // Calculate edge glow
    float edgeDistance = dissolvePattern - dissolveThreshold;
    float edgeFactor = 1.0 - smoothstep(0.0, uEdgeWidth, edgeDistance);
    
    // Simple lighting calculation
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    float lightIntensity = max(dot(vNormal, lightDirection), 0.3);
    
    // Mix base color with edge glow
    vec3 finalColor = mix(uBaseColor * lightIntensity, uEdgeColor, edgeFactor);
    
    // Apply opacity with edge enhancement
    float finalOpacity = uOpacity * (1.0 + edgeFactor * 2.0);
    
    gl_FragColor = vec4(finalColor, finalOpacity);
}