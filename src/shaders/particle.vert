uniform float pointMultiplier;
uniform float spriteColumns;
uniform float spriteRows;

attribute float size;
attribute float angle;
attribute vec4 tintColor;
attribute float frameIndex;

varying vec4 vColor;
varying vec2 vAngle;
varying vec2 vFrameUV;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * pointMultiplier / gl_Position.w;

  vAngle = vec2(cos(angle), sin(angle));
  vColor = tintColor;
  
  // Calculate sprite sheet frame UV offset
  float frameX = mod(frameIndex, spriteColumns);
  float frameY = floor(frameIndex / spriteColumns);
  vFrameUV = vec2(frameX / spriteColumns, frameY / spriteRows);
}