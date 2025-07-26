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
uniform float uTime;

// Depth texture uniforms for edge detection
uniform sampler2D uDepthTexture;
uniform vec2 uResolution;
uniform float uCameraNear;
uniform float uCameraFar;
uniform float uEdgeThickness;
uniform float uEdgeIntensity;
uniform float uDebugDepth;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying vec4 vScreenPosition;

uniform samplerCube uEnvironmentMap;
uniform sampler2D bwTexture;
uniform sampler2D foamTexture;

#include <fog_pars_fragment>

// Convert depth buffer value to linear depth
float linearizeDepth(float depth) {
  float z = depth * 2.0 - 1.0; // Convert to NDC
  return (2.0 * uCameraNear * uCameraFar) / (uCameraFar + uCameraNear - z * (uCameraFar - uCameraNear));
}

// Alternative simpler depth comparison
float getDepthDifference(vec2 screenUV, float currentDepth) {
  // Sample the depth texture directly
  float sampledDepth = texture2D(uDepthTexture, screenUV).r;
  
  // Simple depth difference without linearization first
  return abs(currentDepth - sampledDepth);
}

// Edge detection function
float detectEdges(vec2 screenUV, float currentDepth) {
  vec2 texelSize = 1.0 / uResolution;
  
  // Sample surrounding depth values
  float depth1 = texture2D(uDepthTexture, screenUV + vec2(-texelSize.x, 0.0)).r;
  float depth2 = texture2D(uDepthTexture, screenUV + vec2(texelSize.x, 0.0)).r;
  float depth3 = texture2D(uDepthTexture, screenUV + vec2(0.0, -texelSize.y)).r;
  float depth4 = texture2D(uDepthTexture, screenUV + vec2(0.0, texelSize.y)).r;
  
  // Calculate depth differences (simple version first)
  float depthDiff1 = abs(currentDepth - depth1);
  float depthDiff2 = abs(currentDepth - depth2);
  float depthDiff3 = abs(currentDepth - depth3);
  float depthDiff4 = abs(currentDepth - depth4);
  
  // Find maximum depth difference
  float maxDepthDiff = max(max(depthDiff1, depthDiff2), max(depthDiff3, depthDiff4));
  
  // Create edge mask based on depth threshold
  float edgeMask = smoothstep(0.0, uEdgeThickness, maxDepthDiff);
  
  return edgeMask * uEdgeIntensity;
}

// Alternative edge detection with better depth handling
float detectEdgesLinear(vec2 screenUV, float currentDepth) {
  vec2 texelSize = 1.0 / uResolution;
  
  // Sample surrounding depth values
  float depth1 = texture2D(uDepthTexture, screenUV + vec2(-texelSize.x, 0.0)).r;
  float depth2 = texture2D(uDepthTexture, screenUV + vec2(texelSize.x, 0.0)).r;
  float depth3 = texture2D(uDepthTexture, screenUV + vec2(0.0, -texelSize.y)).r;
  float depth4 = texture2D(uDepthTexture, screenUV + vec2(0.0, texelSize.y)).r;
  
  // Convert to linear depth
  float linearDepth1 = linearizeDepth(depth1);
  float linearDepth2 = linearizeDepth(depth2);
  float linearDepth3 = linearizeDepth(depth3);
  float linearDepth4 = linearizeDepth(depth4);
  float currentLinearDepth = linearizeDepth(currentDepth);
  
  // Calculate depth differences
  float depthDiff1 = abs(currentLinearDepth - linearDepth1);
  float depthDiff2 = abs(currentLinearDepth - linearDepth2);
  float depthDiff3 = abs(currentLinearDepth - linearDepth3);
  float depthDiff4 = abs(currentLinearDepth - linearDepth4);
  
  // Find maximum depth difference
  float maxDepthDiff = max(max(depthDiff1, depthDiff2), max(depthDiff3, depthDiff4));
  
  // Create edge mask based on depth threshold (adjusted for linear depth)
  float edgeMask = smoothstep(0.0, uEdgeThickness * 100.0, maxDepthDiff);
  
  return edgeMask * uEdgeIntensity;
}

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Helper hash function: 2D to 2D hash for point offsets
vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Voronoi function: returns the distance to the nearest point
float voronoi(vec2 uv, float angleOffset, float cellDensity) {
    // Scale UV by cell density to control number of cells
    vec2 scaledUV = uv * cellDensity;
    vec2 cell = floor(scaledUV);
    vec2 frac = fract(scaledUV);

    float minDist = 8.0; // Large initial value

    // Check current cell and 8 neighbors
    for (int y = -1; y <= 1; ++y) {
        for (int x = -1; x <= 1; ++x) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 cellId = cell + neighbor;

            // Generate random angle influenced by angleOffset
            float hash = hash21(cellId);
            float angle = hash * 6.283185 + angleOffset; // 2 * PI

            // Generate random radius (0.0 to 1.0)
            vec2 randomOffset = hash22(cellId);
            float radius = 0.5 + 0.5 * randomOffset.x; // Bias towards center if desired

            // Compute point position within the cell (polar coordinates for angular offset)
            vec2 point = vec2(0.5 + radius * cos(angle), 0.5 + radius * sin(angle));

            // Vector from fractional position to point
            vec2 diff = neighbor + point - frac;

            // Euclidean distance
            float dist = length(diff);

            // Track minimum distance
            minDist = min(minDist, dist);
        }
    }

    return minDist;
}

void main() {
  // Calculate screen UV coordinates
  vec2 screenUV = (vScreenPosition.xy / vScreenPosition.w) * 0.5 + 0.5;
  
  // Get current fragment depth
  float currentDepth = gl_FragCoord.z;
  
  // Detect edges
  float edgeIntensity = detectEdges(screenUV, currentDepth);
  
  // Sample the procedural black and white texture
  float bw = texture2D(bwTexture, vUv).r;

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

  // Mix the final color with the reflection color
  vec3 finalColor = mix(mixedColor2, reflectionColor.rgb, fresnel);

  // Add noise where we have bw value, using foam texture and animated voronoi
  float v = voronoi(vUv, uTime * 3.0, 200.0);
  float foam = texture2D(foamTexture, mod((v - 0.5) * 0.03 + vUv * 20.0, 1.0)).r;
  finalColor = mix(finalColor, vec3(foam), clamp(bw - 0.2, 0.0, 1.0));

  // Add white edge where water meets other geometry
  finalColor = mix(finalColor, vec3(1.0), clamp(edgeIntensity, 0.0, 1.0));

  // Debug mode: show depth texture or edge detection
  if (uDebugDepth > 0.5) {
    float depthSample = texture2D(uDepthTexture, screenUV).r;
    finalColor = vec3(depthSample);
  } else if (uDebugDepth > 0.1) {
    finalColor = vec3(edgeIntensity);
  }

  gl_FragColor = vec4(finalColor, uOpacity);

  #include <fog_fragment>
}
