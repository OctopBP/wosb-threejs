# Particle System Usage Guide

This guide explains how to use the integrated `three-nebula` particle system in your 3D game.

## Overview

The particle system is built into the ECS architecture and provides several predefined effects:

- **Explosion**: Large bursts for enemy destruction
- **Impact**: Small sparks when projectiles hit targets
- **Muzzle Flash**: Weapon firing effects
- **Thrust**: Continuous engine exhaust for ships
- **Damage**: Visual feedback when entities take damage
- **Death**: Dramatic effects when entities are destroyed

## Basic Usage

### 1. Creating One-Time Effects

Use the helper functions from `ParticleFactory` to create temporary effects:

```typescript
import { createExplosionEffect, createImpactEffect, createMuzzleFlashEffect } from '../entities/ParticleFactory'
import { Vector3 } from 'three'

// Create an explosion at a specific position
const explosionPosition = new Vector3(10, 5, 0)
createExplosionEffect(world, explosionPosition, 1.5) // intensity = 1.5

// Create an impact effect when a projectile hits
createImpactEffect(world, hitPosition, 0.8)

// Create muzzle flash when weapon fires
createMuzzleFlashEffect(world, weaponPosition, 1.0)
```

### 2. Adding Continuous Effects to Entities

Add particle effects to existing entities (like thrust on ships):

```typescript
import { addThrustEffect, removeThrustEffect } from '../entities/ParticleFactory'

// Add thrust effect to player ship
const playerEntity = getPlayerEntity()
if (playerEntity) {
    addThrustEffect(playerEntity, 1.0)
}

// Remove thrust when not moving
removeThrustEffect(playerEntity)
```

### 3. Using the ParticleSystem Directly

Access the particle system through GameWorld for advanced usage:

```typescript
// In your system class
const particleSystem = this.gameWorld.getParticleSystem()

// Create effects directly
particleSystem.createExplosion(position, intensity)
particleSystem.createImpact(position, intensity)
particleSystem.createMuzzleFlash(position, intensity)
```

## Integration Examples

### In CollisionSystem

Add particle effects when collisions occur:

```typescript
// In your CollisionSystem.ts
import { createExplosionEffect, createImpactEffect } from '../entities/ParticleFactory'

// When enemy is destroyed
if (enemyHealth.current <= 0) {
    const enemyPos = enemyPosition.position
    createExplosionEffect(this.world, new Vector3(enemyPos.x, enemyPos.y, enemyPos.z), 2.0)
    
    // Remove enemy entity
    this.world.removeEntity(enemy)
}

// When projectile hits target
createImpactEffect(this.world, new Vector3(hitPos.x, hitPos.y, hitPos.z), 1.0)
```

### In WeaponSystem

Add muzzle flash effects when weapons fire:

```typescript
// In your WeaponSystem.ts
import { createMuzzleFlashEffect } from '../entities/ParticleFactory'

// When weapon fires
if (shouldFire) {
    const weaponPos = entityPosition
    createMuzzleFlashEffect(this.world, new Vector3(weaponPos.x, weaponPos.y, weaponPos.z), 1.2)
    
    // Create projectile...
}
```

### In MovementSystem

Add thrust effects based on movement:

```typescript
// In your MovementSystem.ts (or InputSystem)
import { addThrustEffect, removeThrustEffect } from '../entities/ParticleFactory'

// When player is moving
if (hasInput && (input.moveForward || input.moveBackward)) {
    // Add thrust effect if not already present
    const particleComponent = entity.getComponent<ParticleComponent>('particle')
    if (!particleComponent || particleComponent.systemType !== 'thrust') {
        addThrustEffect(entity, 1.0)
    }
} else {
    // Remove thrust when not moving
    removeThrustEffect(entity)
}
```

## Manual Entity Creation

For more control, create particle entities manually:

```typescript
import { Entity } from '../ecs/Entity'
import type { ParticleComponent, PositionComponent } from '../ecs/Component'

// Create custom particle entity
const particleEntity = new Entity()

// Add position
const position: PositionComponent = {
    type: 'position',
    x: 10, y: 5, z: 0,
    rotationX: 0, rotationY: 0, rotationZ: 0
}
particleEntity.addComponent(position)

// Add particle component
const particle: ParticleComponent = {
    type: 'particle',
    systemType: 'explosion',
    active: true,
    duration: 2.0,      // 2 seconds
    intensity: 1.5,     // 1.5x intensity
    autoDestroy: true   // Remove entity when done
}
particleEntity.addComponent(particle)

// Add to world
world.addEntity(particleEntity)
```

## Customizing Effects

### Particle Configuration

Modify effects by editing `src/config/ParticleConfig.ts`:

```typescript
// Example: Make explosions more dramatic
explosion: {
    name: 'explosion',
    particleCount: 100,        // More particles
    lifetime: { min: 1.0, max: 3.0 },  // Longer duration
    colors: ['#ff0000', '#ff4444', '#ff8844', '#ffaa44'],
    size: { min: 0.2, max: 1.0 },      // Larger particles
    velocity: { min: 3, max: 12 },     // Faster particles
    // ... other properties
}
```

### Intensity Scaling

Use intensity parameter to scale effects:

```typescript
// Small explosion (0.5x)
createExplosionEffect(world, position, 0.5)

// Normal explosion (1.0x)
createExplosionEffect(world, position, 1.0)

// Large explosion (2.0x)
createExplosionEffect(world, position, 2.0)
```

## Performance Notes

1. **Auto-destroy**: One-time effects automatically clean up after their duration
2. **Continuous effects**: Remember to remove continuous effects (like thrust) when not needed
3. **Intensity**: Lower intensity = better performance
4. **Particle counts**: Adjust `particleCount` in configs for performance vs. quality balance

## Available Effect Types

- `'explosion'` - Large burst effect for enemy deaths
- `'impact'` - Small spark effect for projectile hits  
- `'muzzleFlash'` - Brief flash for weapon firing
- `'thrust'` - Continuous engine exhaust
- `'damage'` - Visual feedback for taking damage
- `'death'` - Dramatic effect for entity destruction

## System Architecture

The particle system is integrated at system priority 16, running after collision detection but before UI updates:

1. Collision System (10) - Detects hits, triggers particle creation
2. Particle System (16) - Updates three-nebula, manages particle lifecycles  
3. Render System (19) - Renders particles along with other objects

This ensures particles are created in response to game events and properly rendered each frame.