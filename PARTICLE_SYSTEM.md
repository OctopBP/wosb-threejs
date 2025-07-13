# Particle System Documentation

## Overview

The particle system is a comprehensive solution for creating visual effects in the Three.js game engine. It supports both burst and continuous emission, with multiple rendering options including sprite sheets, single images, and colored shapes.

## Features

### Emission Types
- **Burst**: Emits a specified number of particles all at once
- **Continuous**: Emits particles at a specified rate over time

### Rendering Options
- **Sprite Sheets**: Animated particle effects using texture atlases
- **Single Images**: Static particle textures
- **Colored Shapes**: Simple geometric shapes with customizable colors

### Particle Properties
- **Life Cycle**: Configurable age and lifetime
- **Movement**: Velocity, acceleration, gravity, and drag
- **Visual**: Size, color, rotation, and transparency
- **Physics**: Realistic physics simulation with gravity and drag

## Usage

### Basic Particle Effects

The particle system provides three pre-configured effects:

```typescript
// Create an explosion effect
gameWorld.createExplosion({ x: 0, y: 0, z: 0 })

// Create a fire effect (continuous)
gameWorld.createFireEffect({ x: 0, y: 0, z: 0 })

// Create a sparkle effect
gameWorld.createSparkleEffect({ x: 0, y: 0, z: 0 })
```

### Custom Particle Emitters

You can create custom particle emitters with full control over all properties:

```typescript
const entity = world.createEntity()

const emitter: ParticleEmitterComponent = {
    type: 'particleEmitter',
    emissionType: 'burst', // or 'continuous'
    burstCount: 50,
    emissionRate: 30, // particles per second for continuous
    lastEmissionTime: 0,
    position: { x: 0, y: 0, z: 0 },
    emissionArea: {
        type: 'sphere', // 'point', 'sphere', 'box', 'circle'
        radius: 0.5,
    },
    particleConfig: {
        // Life
        minAge: 0.5,
        maxAge: 2.0,
        
        // Size
        minSize: 0.1,
        maxSize: 0.3,
        sizeOverLifetime: true,
        finalSizeMultiplier: 0.1,
        
        // Color
        color: { r: 1, g: 0.5, b: 0, a: 1 },
        colorOverLifetime: true,
        finalColor: { r: 0.5, g: 0, b: 0, a: 0 },
        
        // Velocity
        minSpeed: 2,
        maxSpeed: 5,
        direction: { x: 0, y: 1, z: 0 },
        directionSpread: Math.PI * 2,
        
        // Physics
        gravity: 2,
        drag: 0.1,
        
        // Rotation
        minRotationSpeed: -2,
        maxRotationSpeed: 2,
        
        // Sprite sheet (optional)
        useSpriteSheet: false,
        spriteSheetConfig: {
            textureUrl: 'path/to/spritesheet.png',
            columns: 4,
            rows: 4,
            totalFrames: 16,
            animationSpeed: 10,
        },
    },
    isActive: true,
    totalEmitted: 0,
}

entity.addComponent(emitter)
```

## Emission Areas

### Point
Emits particles from a single point.

### Sphere
Emits particles from within a spherical volume.

### Box
Emits particles from within a rectangular box.

### Circle
Emits particles from within a circular area (2D).

## Integration

The particle system is fully integrated into the game's ECS (Entity Component System) architecture:

- **ParticleComponent**: Individual particle data and behavior
- **ParticleEmitterComponent**: Particle creation and configuration
- **ParticleRendererComponent**: Visual representation
- **ParticleSystem**: Main system that handles all particle logic

## Automatic Effects

The system automatically creates explosion effects when enemies are destroyed, providing immediate visual feedback for player actions.

## Debug Controls

In development mode, the debug GUI includes particle effect controls:

- **Create Explosion**: Creates an explosion at the player's position
- **Create Fire Effect**: Creates a fire effect at the player's position
- **Create Sparkle Effect**: Creates a sparkle effect at the player's position
- **Create Random Effects**: Creates 5 random particle effects around the scene

## Performance

The particle system is optimized for performance:

- Particles are grouped by render type for efficient rendering
- Dead particles are automatically cleaned up
- Uses instanced rendering for similar particles
- Configurable particle limits to prevent performance issues

## Examples

### Explosion Effect
```typescript
// Creates a burst of 50 particles with orange-to-red color transition
// Particles spread in all directions with gravity and drag
gameWorld.createExplosion({ x: 0, y: 0, z: 0 })
```

### Fire Effect
```typescript
// Creates a continuous stream of fire particles
// Particles move upward with slight spread and negative gravity
gameWorld.createFireEffect({ x: 0, y: 0, z: 0 })
```

### Sparkle Effect
```typescript
// Creates a burst of sparkle particles
// Particles fade from white to yellow with rotation
gameWorld.createSparkleEffect({ x: 0, y: 0, z: 0 })
```

## Customization

All particle effects can be customized by passing a configuration object:

```typescript
gameWorld.createExplosion(
    { x: 0, y: 0, z: 0 },
    {
        minSize: 0.2,
        maxSize: 0.5,
        color: { r: 0, g: 1, b: 1, a: 1 }, // Cyan
        minSpeed: 5,
        maxSpeed: 10,
    }
)
```

This allows for easy creation of themed effects while maintaining the core particle system functionality.