precision highp float;

uniform float uOpacity;

uniform vec3 uTroughColor;
uniform vec3 uSurfaceColor;
uniform vec3 uPeakColor;

uniform float uPeakThreshold;
uniform float uPeakTransition;
uniform float uTroughThreshold;
uniform float uTroughTransition;

uniform float uFresnelScale;
uniform float uFresnelPower;

// Ship trails texture uniforms
uniform sampler2D uTrailTexture;
uniform vec2 uTrailWorldSize;
uniform float uFoamIntensity;
uniform float uFoamNoiseScale;

varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform samplerCube uEnvironmentMap;

#include <fog_pars_fragment>

// Simple noise function for foam
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

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

void main() {
  // Calculate vector from camera to the vertex
  vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
  vec3 reflectedDirection = reflect(viewDirection, vNormal);
  reflectedDirection.x = -reflectedDirection.x;

  // Sample environment map to get the reflected color
  vec4 reflectionColor = textureCube(uEnvironmentMap, reflectedDirection);

  // Calculate fresnel effect
  float fresnel = uFresnelScale * pow(1.0 - clamp(dot(viewDirection, vNormal), 0.0, 1.0), uFresnelPower);

  // Calculate elevation-based color
  float elevation = vWorldPosition.y;

  // Calculate transition factors using smoothstep
  float peakFactor = smoothstep(uPeakThreshold - uPeakTransition, uPeakThreshold + uPeakTransition, elevation);
  float troughFactor = smoothstep(uTroughThreshold - uTroughTransition, uTroughThreshold + uTroughTransition, elevation);

  // Mix between trough and surface colors based on trough transition
  vec3 mixedColor1 = mix(uTroughColor, uSurfaceColor, troughFactor);

  // Mix between surface and peak colors based on peak transition
  vec3 mixedColor2 = mix(mixedColor1, uPeakColor, peakFactor);

  // Sample ship trails texture
  vec2 trailUV = (vWorldPosition.xz / uTrailWorldSize) + 0.5;
  float trailIntensity = texture2D(uTrailTexture, trailUV).r;
  
  // Generate foam noise
  vec2 foamNoiseCoord = vWorldPosition.xz * uFoamNoiseScale;
  float foamNoise = noise(foamNoiseCoord);
  
  // Create foam effect where trails are present
  float foamMask = smoothstep(0.1, 0.3, trailIntensity);
  float foam = foamMask * foamNoise * uFoamIntensity;
  
  // Mix the final color with the reflection color
  vec3 finalColor = mix(mixedColor2, reflectionColor.rgb, fresnel);
  
  // Add foam effect
  finalColor = mix(finalColor, vec3(1.0), foam);

  gl_FragColor = vec4(finalColor, uOpacity);

  #include <fog_fragment>
}
