# Physics-Based Movement System Migration

This document summarizes the migration from the old custom movement system to a physics-based movement system using the Rapier physics engine.

## Overview

The old movement system used custom acceleration and velocity calculations. The new system uses the Rapier physics engine to provide realistic physics-based movement with proper collision detection and response.

## Key Changes

### 1. New Dependencies
- Added `@dimforge/rapier3d-compat` package for physics simulation
- Uses the compatibility version for better bundler support

### 2. New Components
- `PhysicsBodyComponent`: Links an entity to a physics rigid body
- `PhysicsForceComponent`: Stores forces and torques to be applied to physics bodies

### 3. New Systems

#### PhysicsSystem
- Initializes and manages the Rapier physics world
- Applies forces to physics bodies
- Steps the physics simulation
- Synchronizes physics positions back to ECS position components
- Creates and manages physics bodies with box colliders

#### PhysicsInitializationSystem
- Automatically creates physics bodies for entities with physics components
- Uses collision shape data to create appropriate physics colliders

#### PhysicsMovementSystem
- Replaces the old AccelerationSystem and MovementSystem
- Applies forces based on player input instead of directly modifying velocity
- Uses physics forces for more realistic movement

### 4. Updated Entity Factories
- PlayerFactory: Added physics components to player ships
- EnemyFactory: Added physics components to enemy ships and bosses

### 5. System Integration
- Updated GameWorld to initialize physics systems
- Replaced old movement systems with physics-based systems
- Added proper async initialization for Rapier

## System Execution Order

1. PhysicsInitializationSystem - Creates physics bodies for new entities
2. EnemyAISystem - Sets movement input for AI entities
3. PhysicsMovementSystem - Applies forces based on input
4. PhysicsSystem - Steps physics simulation and syncs positions

## Benefits

1. **Realistic Movement**: Ships now have proper inertia and momentum
2. **Better Collisions**: Physics engine handles ship-to-ship collisions naturally
3. **Simple API**: Box colliders keep the system simple while providing good physics
4. **Extensible**: Easy to add more complex physics interactions later

## Configuration

- Ships use box colliders based on their collision configuration
- Physics damping is tuned for smooth ship movement (linear: 0.5, angular: 0.8)
- Player ships are slightly heavier (mass: 1.2) than enemy ships (mass: 1.0)
- No gravity is applied to maintain the top-down ship movement feel

## Technical Notes

- Uses the `-compat` version of Rapier for better Vite/bundler compatibility
- Physics bodies are automatically created when entities have the required components
- Forces are cleared each frame after being applied
- Position synchronization happens after physics step to update visual representation

## Old Systems (Kept for Reference)
- AccelerationSystem: No longer used
- MovementSystem: No longer used  
- RotationSystem: No longer used

These systems are still in the codebase but not registered with the world, allowing for easy rollback if needed.