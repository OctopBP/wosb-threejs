# Arrow Sprite

## Requirements

Place your `arrow.png` sprite file in this directory.

### Sprite Specifications:
- **Filename**: `arrow.png`
- **Direction**: Arrow should point **upward** (to the top) in the image
- **Format**: PNG with transparency support
- **Recommended size**: 64x64 pixels or 128x128 pixels
- **Background**: Transparent

### Usage:
The arrow sprite is used by the `EnemyArrowSystem` to create directional indicators pointing toward enemies. The system will:
1. Load the texture automatically when the system initializes
2. Position arrows around the player at a 3.0 unit radius
3. Rotate the sprite to point toward each enemy
4. Apply the configured arrow color as a tint

### Example Implementation:
```typescript
// The system loads the texture and creates sprites
const spriteMaterial = new SpriteMaterial({
    map: this.arrowTexture,
    color: enemyArrow.arrowColor, // Red by default
    transparent: true,
});

const arrow = new Sprite(spriteMaterial);
arrow.material.rotation = angle; // Points toward enemy
```