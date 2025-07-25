# Physics-Based Ship Movement System

This document describes the new physics-based ship movement system that has been implemented to replace the simple velocity-based movement with realistic physics simulation and ship-to-ship collision detection.

## Overview

The new system provides:
- **Physics-based movement** with mass, friction, drag, and momentum
- **Ship-to-ship collision detection** with realistic collision response
- **Proper force application** instead of direct velocity manipulation
- **Configurable physics properties** for different ship types

## Components

### PhysicsComponent

A new component that defines physical properties for entities:

```typescript
interface PhysicsComponent {
    mass: number              // Mass affects acceleration and collision response
    friction: number          // Friction coefficient (0-1)
    restitution: number       // Bounciness factor (0-1) 
    drag: number             // Air/water resistance
    lastCollisionForce: Vector3  // Forces from collisions
    isKinematic: boolean     // If true, not affected by physics but can affect others
    enableCollisionResponse: boolean // If true, responds to collisions
}
```

## Systems

### PhysicsMovementSystem

Replaces the old `MovementSystem` and `AccelerationSystem` with physics-based movement:

- **Input Forces**: Applies forces based on input instead of directly setting velocity
- **Friction**: Opposes motion to create realistic stopping behavior
- **Drag**: Velocity-dependent resistance (realistic for ships in water)
- **Collision Forces**: Applies forces from collisions
- **Mass-based Acceleration**: Heavier ships are less responsive

### ShipCollisionSystem

Handles ship-to-ship collisions:

- **Collision Detection**: Supports both sphere and box colliders
- **Separation**: Prevents objects from overlapping
- **Impulse Response**: Realistic collision response based on mass and velocity
- **Restitution**: Controls how bouncy collisions are

### EnemyAIPhysicsSystem

Physics-compatible version of enemy AI:

- **Force Application**: Applies forces instead of setting velocity directly
- **Mass Consideration**: Takes ship mass into account for movement
- **Dampening**: Prevents overshooting when approaching targets

## Physics Presets

Different ship types have different physics characteristics:

### Player Ship Physics
```typescript
{
    mass: 1.0,           // Standard mass for responsiveness
    friction: 1.5,       // Lower friction for better control
    restitution: 0.4,    // Moderate bounce
    drag: 0.3,          // Lower drag for better control
}
```

### Enemy Ship Physics
```typescript
{
    mass: 1.2,          // Slightly heavier than player
    friction: 2.5,      // Higher friction, less agile
    restitution: 0.2,   // Less bouncy
    drag: 0.6,         // More drag
}
```

### Boss Ship Physics
```typescript
{
    mass: 3.0,          // Much heavier, imposing presence
    friction: 3.0,      // High friction, slow to change direction
    restitution: 0.1,   // Very low bounce
    drag: 0.8,         // High drag
}
```

### Barrel Physics
```typescript
{
    mass: 0.5,          // Light weight
    friction: 1.0,      // Moderate friction
    restitution: 0.6,   // Quite bouncy
    drag: 0.4,         // Moderate drag
}
```

## System Order

The systems are executed in this order for proper physics simulation:

1. **Input System** - Process user input
2. **Enemy AI Physics System** - Apply AI forces
3. **Rotation System** - Handle ship rotation
4. **Physics Movement System** - Apply physics forces and update positions
5. **Ship Collision System** - Detect and resolve ship collisions
6. **Other Systems** - Wave rocking, weapons, etc.

## Collision Detection

### Supported Collider Types

- **Sphere Colliders**: Fast and simple, good for round objects
- **Box Colliders**: More accurate for rectangular ships
- **Mixed Collisions**: Automatically converts to sphere collision for simplicity

### Collision Response

The system uses impulse-based collision response:

1. **Detect Collision**: Check for overlap between colliders
2. **Calculate Separation**: Move objects apart to prevent overlap
3. **Calculate Impulse**: Based on mass, velocity, and restitution
4. **Apply Forces**: Update velocities based on collision impulse

## Configuration

### Physics Configuration

Physics properties are defined in `src/config/PhysicsConfig.ts`:

```typescript
// Create physics component with preset
const physics = createPhysicsComponent(playerPhysicsPreset)

// Create with custom overrides
const customPhysics = createCustomPhysicsComponent(playerPhysicsPreset, {
    mass: 2.0,
    friction: 3.0
})
```

### Entity Factories

Ship entities now automatically include physics components:

- **Player Ships**: Use `playerPhysicsPreset`
- **Enemy Ships**: Use `enemyPhysicsPreset` 
- **Boss Ships**: Use `bossPhysicsPreset`
- **Barrels**: Use `barrelPhysicsPreset`

## Benefits

### Realistic Movement
- Ships have momentum and don't stop instantly
- Heavier ships feel more massive and harder to maneuver
- Friction provides natural deceleration

### Engaging Collisions
- Ships bounce off each other realistically
- Mass differences affect collision outcomes
- Collisions feel impactful and meaningful

### Configurable Behavior
- Easy to tune physics properties for gameplay
- Different ship types have distinct movement characteristics
- Balance can be adjusted through physics parameters

## Usage

The physics system works automatically once entities have the required components:

1. **Position Component**: Entity location
2. **Velocity Component**: Current movement
3. **Physics Component**: Physical properties
4. **Collision Component**: Collision shape (for ship-to-ship collisions)

For player ships, input is processed through the existing input system. For AI ships, the `EnemyAIPhysicsSystem` handles movement.

## Performance Considerations

- **O(n²) Collision Detection**: All ships check against all other ships
- **Optimization Opportunities**: Spatial partitioning could be added for many ships
- **Physics Overhead**: More calculations than simple movement, but still efficient for typical ship counts

The system is designed to handle the typical number of ships in the game efficiently while providing much more realistic and engaging movement and collision behavior.