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
    
    // Create detailed wave animation using multiple sine functions
    vec3 modifiedPosition = position;
    
    // Primary wave motion - large scale movement
    float sineOffset = sin(uTime * uWaveSpeed) * uWaveAmplitude;
    modifiedPosition.z += sineOffset;
    
    // Secondary wave details for more realistic water surface
    float wave1 = sin(position.x * 0.1 + uTime * uWaveSpeed * 0.8) * uWaveAmplitude * 0.5;
    float wave2 = sin(position.y * 0.15 + uTime * uWaveSpeed * 0.6) * uWaveAmplitude * 0.3;
    
    // Tertiary waves for fine detail
    float wave3 = sin(position.x * 0.25 + uTime * uWaveSpeed * 1.2) * uWaveAmplitude * 0.2;
    float wave4 = sin(position.y * 0.2 + uTime * uWaveSpeed * 0.9) * uWaveAmplitude * 0.15;
    
    // Cross waves for more complex motion
    float crossWave1 = sin((position.x + position.y) * 0.08 + uTime * uWaveSpeed * 0.7) * uWaveAmplitude * 0.4;
    float crossWave2 = sin((position.x - position.y) * 0.12 + uTime * uWaveSpeed * 1.1) * uWaveAmplitude * 0.25;
    
    // Combine all wave motions
    modifiedPosition.z += wave1 + wave2 + wave3 + wave4 + crossWave1 + crossWave2;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(modifiedPosition, 1.0);
}