# Rapier Physics Integration

This document describes the integration of Rapier.js physics engine into the game, replacing the previous manual position-based movement system with realistic physics simulation.

## Overview

The game now uses [Rapier.js](https://rapier.rs/), a fast 2D and 3D physics engine, to handle:
- Ship movement and collisions between ships
- Realistic momentum and inertia
- Physics-based forces for movement instead of direct position manipulation
- Better collision detection and response

## Key Components

### New Physics Components

#### PhysicsComponent
- **Purpose**: Links ECS entities to Rapier rigid bodies
- **Properties**:
  - `rigidBodyHandle`: Reference to the Rapier rigid body
  - `rigidBodyType`: 'dynamic', 'kinematic', or 'fixed'
  - `mass`, `restitution`, `friction`, `linearDamping`, `angularDamping`

#### PhysicsForceComponent
- **Purpose**: Accumulates forces and torques to apply to rigid bodies
- **Properties**:
  - `force`: Linear forces in world space (x, y, z)
  - `torque`: Angular forces around each axis (x, y, z)
  - `applyAtCenterOfMass`: Whether to apply forces at center of mass

#### PhysicsColliderComponent
- **Purpose**: Links ECS entities to Rapier colliders for collision detection
- **Properties**:
  - `colliderHandle`: Reference to the Rapier collider
  - `colliderType`: 'box', 'sphere', 'capsule', 'cylinder'
  - `dimensions`: Size parameters for the collider shape
  - `isSensor`: Whether the collider generates events without physical response

#### VelocityComponent
- **Purpose**: Syncs physics velocities with ECS for other systems to read
- **Properties**:
  - `dx`, `dy`, `dz`: Linear velocity components
  - `angularVelocityX`, `angularVelocityY`, `angularVelocityZ`: Angular velocity components

## Core Systems

### PhysicsSystem
- **Responsibility**: Manages the Rapier physics world and simulation
- **Functions**:
  - Initializes the Rapier physics world (no gravity for water surface simulation)
  - Steps the physics simulation each frame
  - Applies accumulated forces and torques to rigid bodies
  - Syncs physics state back to ECS position and velocity components
  - Provides helper methods for creating/removing rigid bodies and colliders

### PhysicsInitializationSystem
- **Responsibility**: Automatically sets up physics components for entities
- **Functions**:
  - Detects entities with position components but no physics components
  - Creates appropriate rigid bodies and colliders based on entity type:
    - **Ships** (player/enemy): Dynamic rigid bodies with box colliders
    - **Projectiles**: Dynamic rigid bodies with sphere colliders
  - Applies appropriate physics properties (mass, damping, etc.)

### MovementSystem (Rewritten)
- **Previous**: Directly modified position components based on speed and direction
- **Current**: Applies forces and torques to physics bodies based on input and movement config
- **Benefits**:
  - Ships have realistic momentum and inertia
  - Ship-to-ship collisions work automatically
  - More realistic movement behavior on water surface

## Physics Configuration

### Ship Physics Properties
- **Rigid Body Type**: Dynamic (affected by forces and collisions)
- **Mass**: Player ships = 2.0, Enemy ships = 1.5
- **Linear Damping**: 0.6 (simulates water drag)
- **Angular Damping**: 0.9 (ships turn more slowly in water)
- **Collider**: Box shape (2.0 × 1.0 × 4.0) representing ship hull
- **Restitution**: 0.1 (low bounce)
- **Friction**: 0.3 (moderate sliding)

### Projectile Physics Properties
- **Rigid Body Type**: Dynamic (affected by forces)
- **Mass**: 0.1 (much lighter than ships)
- **Linear Damping**: 0.1 (less drag than ships)
- **Angular Damping**: 0.2
- **Collider**: Sphere shape (radius = 0.2)
- **Restitution**: 0.8 (higher bounce for projectiles)
- **Friction**: 0.1 (low friction)

## System Execution Order

The physics systems are integrated into the existing system execution order:

1. **Input/Game State Systems** - Process input and game logic
2. **PhysicsInitializationSystem** - Set up physics bodies for new entities
3. **AI/Input Processing** - Determine desired movement
4. **MovementSystem** - Convert movement intentions to physics forces
5. **PhysicsSystem** - Step physics simulation and sync back to ECS
6. **Other Systems** - Rendering, UI, etc. using updated positions

## Benefits of Physics Integration

### Realistic Movement
- Ships have momentum and can't instantly stop or change direction
- Turning feels more realistic with angular velocity
- Water drag effect through damping

### Ship Collisions
- Ships can now collide with each other realistically
- Larger ships push smaller ships around
- Collision forces feel natural

### Extensibility
- Easy to add new physics phenomena (currents, wind, etc.)
- Can add joints between entities (chains, ropes, etc.)
- Physics-based special effects

### Performance
- Rapier is optimized for real-time simulation
- Collision detection is handled efficiently
- Physics simulation runs in parallel where possible

## Development Notes

### Vite Configuration
Added plugins for WebAssembly support:
```javascript
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

plugins: [
    wasm(),
    topLevelAwait(),
    // ... other plugins
]
```

### Memory Management
- Physics bodies and colliders are automatically cleaned up when entities are removed
- Rapier handles internal memory management efficiently
- No manual memory cleanup required in typical usage

### Physics World Separation
- The Rapier physics world is separate from the ECS world
- PhysicsSystem maintains the bridge between them
- This allows physics simulation to run independently of ECS logic

## Future Enhancements

### Water Simulation
- Could add water current forces
- Wave physics affecting ship movement
- Water resistance based on ship shape

### Advanced Collisions
- Damage based on collision force
- Ship destruction from hard impacts
- Debris physics

### Environmental Physics
- Wind effects on sails
- Magnetic effects for special items
- Gravity wells or repulsion fields

## Migration Notes

The migration from manual movement to physics required:

1. **Component Updates**: Added physics-related components
2. **Entity Factories**: Added velocity components to ship entities
3. **System Rewrite**: MovementSystem now applies forces instead of moving positions
4. **Build System**: Added WASM support for Rapier
5. **Execution Order**: Integrated physics systems into the update loop

The old collision system remains as a backup, but physics-based collision detection through Rapier can replace it in the future for even better collision handling.