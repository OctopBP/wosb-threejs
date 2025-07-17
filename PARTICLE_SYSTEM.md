# Particle System Documentation

This particle system supports both burst and continuous particle emission, with support for sprite sheets, single images, and colored shapes. It's built using the ECS (Entity Component System) architecture.

## Features

- **Emission Types**: Burst (one-time emission) and continuous (ongoing emission)
- **Particle Types**: 
  - Colored shapes (circle, square, triangle)
  - Single image sprites
  - Animated sprite sheets
- **Physics**: Velocity, acceleration, gravity, and variance for natural randomness
- **Visual Effects**: Size animation, color animation, opacity fade
- **Performance**: Automatic cleanup, texture caching, and configurable particle limits

## Quick Start

### 1. Add the ParticleSystem to your game

```typescript
import { ParticleSystem } from './systems/ParticleSystem'

// In your game initialization
const particleSystem = new ParticleSystem(world, scene)
// Add to your system update loop
```

### 2. Create particle effects using the factory

```typescript
import { ParticleFactory } from './entities/ParticleFactory'

// Create the factory
const particleFactory = new ParticleFactory(world)

// Create an explosion at position (0, 0, 0)
const explosion = particleFactory.createExplosion({ x: 0, y: 0, z: 0 }, 'large')

// Create a healing effect
const healing = particleFactory.createHealingEffect({ x: 5, y: 2, z: 0 })

// Add a projectile trail to an existing projectile entity
particleFactory.createProjectileTrail(projectileEntity)
```

## Available Presets

The following particle effect presets are available:

- **`explosion`**: Burst of orange/red particles with physics
- **`smoke`**: Continuous upward-drifting gray particles
- **`fire`**: Continuous orange/yellow flame particles
- **`sparks`**: Quick burst of bright yellow sparks
- **`healing`**: Gentle green particles that float upward
- **`projectileTrail`**: Blue trailing particles for projectiles
- **`debris`**: Brown/gray chunks that fall with gravity
- **`magic`**: Purple mystical particles
- **`steam`**: Light gray particles that rise and fade
- **`blood`**: Red droplets that fall with gravity

## Usage Examples

### Basic Particle Effects

```typescript
// Create different types of explosions
const smallExplosion = particleFactory.createExplosion(position, 'small')
const mediumExplosion = particleFactory.createExplosion(position, 'medium')
const largeExplosion = particleFactory.createExplosion(position, 'large')

// Create environmental effects
const fire = particleFactory.createFire(position)
const smoke = particleFactory.createSmoke(position)
const steam = particleFactory.createSteam(position)

// Create combat effects
const sparks = particleFactory.createSparks(position)
const blood = particleFactory.createBloodEffect(position)
const debris = particleFactory.createDebris(position, 'many')
```

### Custom Particle Effects

```typescript
import { createCustomParticleEmitter } from './config/ParticleConfig'

// Create a custom particle effect
const customConfig = {
    isActive: true,
    emissionType: 'continuous' as const,
    particleCount: 15, // particles per second
    duration: 5.0, // 5 seconds
    particleType: 'shape' as const,
    shapeConfig: {
        type: 'circle' as const,
        color: 0x00ff00, // green
        opacity: 0.8,
    },
    startPosition: { x: 0, y: 0, z: 0 },
    positionVariance: { x: 0.5, y: 0.1, z: 0.5 },
    startVelocity: { x: 0, y: 2, z: 0 },
    velocityVariance: { x: 1, y: 0.5, z: 1 },
    acceleration: { x: 0, y: 0.5, z: 0 },
    particleLifetime: 3.0,
    lifetimeVariance: 1.0,
    startSize: 0.2,
    endSize: 0.8,
    sizeVariance: 0.1,
    startOpacity: 1.0,
    endOpacity: 0.0,
    maxParticles: 50,
}

const customEffect = particleFactory.createCustomParticleEffect(customConfig, position)
```

### Sprite-Based Particles

```typescript
// Single sprite particles
const spriteEffect = particleFactory.createSpriteParticleEffect(
    position,
    'path/to/particle-texture.png',
    {
        particleCount: 30,
        particleLifetime: 2.0,
        startSize: 0.5,
        endSize: 0.1,
    }
)

// Animated sprite sheet particles
const animatedEffect = particleFactory.createSpriteSheetParticleEffect(
    position,
    'path/to/spritesheet.png',
    {
        columns: 4,
        rows: 4,
        totalFrames: 16,
        animationSpeed: 10, // 10 frames per second
        randomStartFrame: true,
    },
    {
        particleCount: 20,
        particleLifetime: 1.6, // 16 frames at 10fps
    }
)
```

### Modifying Presets

```typescript
import { ParticleUtils } from './config/ParticleConfig'

// Scale down particle count for better performance
const lowPerformanceExplosion = particleFactory.createParticleEffect(
    'explosion',
    position,
    ParticleUtils.scaleParticleCount(PARTICLE_PRESETS.explosion, 0.5)
)

// Make effects last longer
const longFire = particleFactory.createParticleEffect(
    'fire',
    position,
    ParticleUtils.scaleLifetime(PARTICLE_PRESETS.fire, 2.0)
)

// Change colors
const blueExplosion = particleFactory.createParticleEffect(
    'explosion',
    position,
    ParticleUtils.recolor(
        PARTICLE_PRESETS.explosion,
        { r: 0, g: 0.5, b: 1 }, // blue start
        { r: 0, g: 0.2, b: 0.8 } // darker blue end
    )
)

// Scale size
const giantSparks = particleFactory.createParticleEffect(
    'sparks',
    position,
    ParticleUtils.scaleSize(PARTICLE_PRESETS.sparks, 3.0)
)
```

### Controlling Particle Emitters

```typescript
// Stop emitting particles (existing particles continue to live)
particleFactory.stopParticleEmitters(particleEntity)

// Restart particle emission
particleFactory.startParticleEmitters(particleEntity)

// Add multiple emitters to one entity
particleFactory.addParticleEmitterToEntity(entity, 'fire')
particleFactory.addParticleEmitterToEntity(entity, 'smoke')
```

## Integration Examples

### Weapon Impact Effects

```typescript
// In your collision system
if (projectileHitsEnemy) {
    const hitPosition = { x: enemy.x, y: enemy.y, z: enemy.z }
    
    // Create sparks on impact
    particleFactory.createSparks(hitPosition)
    
    // Create blood effect
    particleFactory.createBloodEffect(hitPosition)
}
```

### Enemy Destruction

```typescript
// When an enemy is destroyed
const enemyPosition = { x: enemy.x, y: enemy.y, z: enemy.z }

// Create explosion
particleFactory.createExplosion(enemyPosition, 'medium')

// Create debris
particleFactory.createDebris(enemyPosition, 'normal')

// Optional: Create smoke after explosion
setTimeout(() => {
    particleFactory.createSmoke(enemyPosition)
}, 500)
```

### Player Abilities

```typescript
// Healing ability
function useHealingAbility(playerPosition) {
    particleFactory.createHealingEffect(playerPosition)
}

// Magic spell
function castMagicSpell(targetPosition) {
    particleFactory.createMagicEffect(targetPosition)
}
```

### Environmental Effects

```typescript
// Damaged building emitting smoke
const damagedBuilding = world.createEntity()
// ... add other components
particleFactory.addParticleEmitterToEntity(damagedBuilding, 'smoke')

// Campfire
const campfire = world.createEntity()
// ... add other components
particleFactory.addParticleEmitterToEntity(campfire, 'fire')
particleFactory.addParticleEmitterToEntity(campfire, 'smoke')
```

## Performance Considerations

1. **Particle Limits**: Each emitter has a `maxParticles` limit to prevent memory issues
2. **Automatic Cleanup**: Dead particles are automatically removed and their resources disposed
3. **Texture Caching**: Textures are cached to avoid repeated loading
4. **Scale Effects**: Use `ParticleUtils.scaleParticleCount()` to reduce particle counts on lower-end devices

## File Structure

```
src/
├── systems/
│   └── ParticleSystem.ts         # Main particle system logic
├── entities/
│   └── ParticleFactory.ts        # Factory for creating particle effects
├── config/
│   └── ParticleConfig.ts         # Presets and configuration
└── ecs/
    └── Component.ts              # ParticleEmitterComponent definition
```

The particle system is fully integrated with your existing ECS architecture and can be easily extended with new presets and configurations as needed.