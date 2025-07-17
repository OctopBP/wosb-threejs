# Particle System Documentation

The particle system in this project uses **three-nebula** to create various visual effects like gun smoke, muzzle flashes, and other particle-based animations.

## Features

- ✅ **Burst and Constant Emission**: Support for both one-time bursts and continuous particle emission
- ✅ **Multiple Render Types**: Shape-based, sprite-based, and sprite sheet support (sprite sheets ready for textures)
- ✅ **ECS Integration**: Fully integrated with the Entity-Component-System architecture
- ✅ **Automatic Cleanup**: Particles are automatically removed when their lifetime expires
- ✅ **Preset System**: Predefined configurations for common effects
- ✅ **Programmatic Textures**: Automatically generated smoke and spark textures
- 🔄 **Sprite Sheet Animation**: Framework ready for 3x3 sprite sheet animations

## Architecture

### Components

- **ParticleComponent**: ECS component that tracks particle system metadata
- **ParticleSystem**: Main system that manages three-nebula integration
- **ParticleConfig**: Configuration interfaces and presets

### Key Files

- `src/systems/ParticleSystem.ts` - Main particle system implementation
- `src/config/ParticleConfig.ts` - Configuration and presets
- `src/utils/ParticleUtils.ts` - Utility functions for textures
- `src/ecs/Component.ts` - ParticleComponent definition
- `src/@types/three-nebula.d.ts` - TypeScript declarations for three-nebula

## Usage

### Basic Usage

The particle system is automatically initialized in `GameWorld` and connected to the weapon system. Gun smoke and muzzle flash effects are automatically created when weapons fire.

### Accessing the Particle System

```typescript
// Get the particle system from GameWorld
const particleSystem = gameWorld.getParticleSystem()

// Create a gun smoke effect
const position = new Vector3(0, 1, 0)
const direction = new Vector3(0, 0, 1)
particleSystem.createGunSmoke(position, direction)

// Create a muzzle flash effect
particleSystem.createMuzzleFlash(position, direction)
```

### Using Presets

```typescript
// Create any preset effect
const systemId = particleSystem.createEffect('gunSmoke', position)

// Stop the effect early
particleSystem.stopParticleSystem(systemId)

// Remove the effect completely
particleSystem.removeParticleSystem(systemId)
```

### Available Presets

1. **gunSmoke** - Smoke effect for gun shots
   - 6 particles per burst
   - 0.8-1.5 second lifetime
   - Uses smoke texture
   - Automatically removed

2. **muzzleFlash** - Bright flash for gun shots
   - 2 particles per burst
   - 0.05-0.15 second lifetime
   - Uses spark texture
   - Automatically removed

3. **constantSmoke** - Continuous smoke emission
   - 20 particles per second
   - 2-3 second lifetime
   - Not automatically removed

## Configuration

### Creating Custom Presets

Add new presets to `PARTICLE_PRESETS` in `src/config/ParticleConfig.ts`:

```typescript
myCustomEffect: {
    maxParticles: 30,
    burstCount: 10,
    life: { min: 1.0, max: 2.0 },
    positionSpread: { x: 0.2, y: 0.1, z: 0.2 },
    velocity: new Vector3(0, 3, 0),
    velocitySpread: { x: 2, y: 1, z: 2 },
    size: { start: 0.1, end: 0.8 },
    color: {
        start: { r: 1.0, g: 0.5, b: 0.0, a: 1.0 },
        end: { r: 0.5, g: 0.0, b: 0.0, a: 0.0 }
    },
    renderType: 'sprite',
    texture: '/path/to/texture.png', // Optional
    gravity: new Vector3(0, -1, 0),
    autoRemove: true
}
```

### Render Types

1. **'shape'**: Uses programmatically generated circular texture
2. **'sprite'**: Uses smoke or spark texture (auto-selected based on preset name)
3. **'spritesheet'**: Ready for animated sprite sheets (requires texture + config)

### Sprite Sheet Configuration (Future)

```typescript
spriteSheetConfig: {
    columns: 3,
    rows: 3,
    animationSpeed: 12, // frames per second
    loop: false
}
```

## Adding Gun Smoke to New Weapons

The particle system automatically creates gun smoke and muzzle flash effects for any weapon that fires. This is handled in `WeaponSystem.ts` in both `fireProjectile` and `fireProjectileToTarget` methods.

If you want to customize the effects per weapon type, you can:

1. Add weapon-specific presets to `ParticleConfig.ts`
2. Modify `WeaponSystem.ts` to use different presets based on weapon properties
3. Create custom particle effects in weapon-specific code

## Future Enhancements

### Sprite Sheet Support

To add 3x3 sprite sheet support for gun smoke:

1. **Create/Add Sprite Sheet Texture**: Place your 3x3 sprite sheet in `public/assets/textures/`

2. **Update Preset Configuration**:
   ```typescript
   gunSmoke: {
       // ... existing config
       renderType: 'spritesheet',
       texture: '/assets/textures/smoke_3x3.png',
       spriteSheetConfig: {
           columns: 3,
           rows: 3,
           animationSpeed: 12,
           loop: false
       }
   }
   ```

3. **Implement Sprite Sheet Renderer**: The system is prepared for this, but three-nebula requires custom sprite sheet animation logic.

### Performance Optimizations

- Object pooling for particle entities
- Culling particles outside camera view
- LOD (Level of Detail) based on distance
- Batch rendering optimizations

### Additional Effects

- Explosion particles
- Engine exhaust trails
- Hit impact sparks
- Environmental effects (rain, snow)
- UI particle effects

## Troubleshooting

### Common Issues

1. **Particles not appearing**: Check that the ParticleSystem is properly initialized and connected to WeaponSystem
2. **Build errors**: Ensure `@babel/runtime` is installed for three-nebula compatibility
3. **Performance issues**: Reduce particle counts in presets or implement culling

### Debug Tips

- Monitor particle counts in browser dev tools
- Use `particleSystem.particleSystems.size` to check active systems
- Enable WebGL debugging for rendering issues
- Check console for three-nebula warnings

## Dependencies

- **three-nebula**: Particle system library
- **@babel/runtime**: Required dependency for three-nebula
- **three.js**: Core 3D library

The particle system is designed to be flexible and extensible while maintaining good performance for real-time game effects.