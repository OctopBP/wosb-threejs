# Particle Textures Directory

This directory is for particle effect textures, including sprite sheets for animated particles.

## Sprite Sheet Format

For 3x3 sprite sheets (like gun smoke), organize your texture like this:

```
Frame 1  Frame 2  Frame 3
Frame 4  Frame 5  Frame 6
Frame 7  Frame 8  Frame 9
```

Each frame should be equally sized. For example, if your sprite sheet is 192x192 pixels, each frame would be 64x64 pixels.

## Adding Gun Smoke Sprite Sheet

1. **Create your 3x3 sprite sheet** with smoke animation frames
2. **Save it as** `smoke_3x3.png` in this directory
3. **Update the gun smoke preset** in `src/config/ParticleConfig.ts`:

```typescript
gunSmoke: {
    // ... existing config
    renderType: 'spritesheet',
    texture: '/assets/textures/smoke_3x3.png',
    spriteSheetConfig: {
        columns: 3,
        rows: 3,
        animationSpeed: 12, // frames per second
        loop: false
    }
}
```

## Supported Formats

- PNG (recommended for transparency)
- JPG (for opaque textures)
- WebP (for smaller file sizes)

## Naming Convention

- `smoke_3x3.png` - Gun smoke sprite sheet
- `explosion_4x4.png` - Explosion sprite sheet
- `spark_2x2.png` - Spark/flash sprite sheet
- `dust_3x3.png` - Dust cloud sprite sheet

## Example Sprite Sheets

You can find example particle sprite sheets at:
- [OpenGameArt.org](https://opengameart.org/)
- [Kenney.nl](https://kenney.nl/assets/particle-pack)
- [itch.io](https://itch.io/game-assets/free/tag-particles)

Remember to check licensing requirements for any assets you use.