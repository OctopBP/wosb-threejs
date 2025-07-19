uniform sampler2D diffuseTexture;
uniform float spriteColumns;
uniform float spriteRows;

varying vec4 vColor;
varying vec2 vAngle;
varying vec2 vFrameUV;

void main() {
  // Apply rotation to the point coordinates
  vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
  
  // Calculate sprite sheet UV coordinates
  vec2 spriteSize = vec2(1.0 / spriteColumns, 1.0 / spriteRows);
  vec2 spriteUV = vFrameUV + coords * spriteSize;
  
  gl_FragColor = texture2D(diffuseTexture, spriteUV) * vColor;
}