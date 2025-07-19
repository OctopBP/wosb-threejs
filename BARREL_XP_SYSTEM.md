# Experience Barrel System Implementation

This document explains the new experience barrel system that replaces the direct XP awarding mechanism when enemies are defeated.

## Overview

Previously, players gained XP immediately when killing enemies. Now, when enemies are defeated, they drop barrels into the water. Players must sail near these barrels to collect them and gain XP. Each barrel contains a portion of the total XP that the enemy would have awarded.

## System Components

### 1. Components Added

#### `XPBarrelComponent`
- **Purpose**: Defines the core properties of an XP barrel
- **Properties**:
  - `xpValue`: How much XP this barrel gives when collected
  - `collectionRange`: Distance within which player can collect this barrel
  - `isCollected`: Whether this barrel has been collected
  - `floatHeight`: Height offset for floating animation
  - `floatSpeed`: Speed of floating animation
  - `spawnTime`: When this barrel was spawned
  - `lifespan`: How long before barrel disappears (in seconds, 0 = infinite)
  - `animationState`: Current animation state (flying, floating, attracting, collecting)
  - `startPosition`: 3D position where barrel starts (enemy ship center)
  - `targetPosition`: 3D position where barrel will land
  - `flightTime`: Total time for arc flight (1.0-1.5 seconds)
  - `flightProgress`: Progress of flight animation (0-1)
  - `arcHeight`: Maximum height of parabolic trajectory (2-4 units)
  - `collectAnimationProgress`: Progress of collection animation (0-1)
  - `collectAnimationDuration`: Duration of collection animation in seconds

#### `CollectableComponent`
- **Purpose**: Generic component for items that can be collected by the player
- **Properties**:
  - `collectionRange`: Distance within which collection occurs
  - `autoCollect`: Whether to collect automatically when in range
  - `requiresInput`: Whether player needs to press a key to collect
  - `collectedBy`: Entity IDs that have collected this item

### 2. Entity Factory

#### `BarrelFactory.ts`
- **Purpose**: Creates XP barrel entities with proper components
- **Key Functions**:
  - `createXPBarrel()`: Creates a single barrel entity
  - `spawnBarrelsAroundPosition()`: Spawns multiple barrels in a radius around a position

#### Barrel Configurations
- **Regular Enemy Barrels**: 5 barrels × 5 XP each = 25 XP total
- **Boss Barrels**: 25 barrels × 20 XP each = 500 XP total (maintains 20x multiplier)

### 3. System Added

#### `BarrelCollectionSystem`
- **Purpose**: Handles barrel animations, collection logic, and XP awarding
- **Features**:
  - **Explosion Animation**: Arc-based scattering from enemy ship center
  - **Parabolic Trajectories**: Realistic physics-based flight paths
  - **State Management**: Tracks and transitions between animation states
  - **Magnetic Attraction**: Smooth movement toward player when in range
  - **Collection Animation**: Spinning upward movement before collection
  - **Range-based Detection**: Automatic collection when player is close enough
  - **Cleanup**: Automatic barrel removal after collection or expiration
  - **XP Integration**: Awards XP through existing LevelingSystem

### 4. Model Configuration

#### Added barrel model support
- Added `barrel` model type to `ModelConfig.ts`
- Maps to `barrel.glb` asset file
- Scale set to 1.5 for better visibility

## Configuration Options

### Barrel Spawn Configuration

```typescript
interface BarrelSpawnConfig {
    xpValue: number       // XP value per barrel
    collectionRange: number // How close player needs to be to collect
    floatSpeed: number    // Animation speed
    lifespan: number      // How long barrels last (0 = infinite)
    spawnCount: number    // How many barrels to spawn
    spawnRadius: number   // Radius around death position to spawn barrels
}
```

### Default Configurations

#### Regular Enemy (defaultBarrelConfig):
- 5 barrels per enemy
- 5 XP per barrel (25 XP total)
- 3.0 unit collection range
- 30 second lifespan
- 2.0 unit spawn radius

#### Boss Enemy (bossBarrelConfig):
- 25 barrels per boss
- 20 XP per barrel (500 XP total)
- 3.0 unit collection range  
- 60 second lifespan
- 4.0 unit spawn radius

## Visual Features

### Barrel Behavior & Animations
- **Explosion Animation**: Barrels scatter from enemy ship center in random directions with realistic arc trajectories
- **Arc Flight**: Each barrel follows a parabolic path with random height (2-4 units) and distance within spawn radius
- **Flight Time**: Barrels take 1.0-1.5 seconds to complete their arc flight
- **Spinning Effect**: Barrels spin on all axes during flight for dynamic visual effect
- **Water Landing**: Barrels land at random positions around the enemy death location
- **Floating State**: After landing, barrels float on water with gentle random drift
- **Magnetic Collection**: When player enters collection range (3 units), barrels smoothly move toward the ship (8.0 units/second)
- **Collection Animation**: Barrels spin and move upward over 0.5 seconds before being collected
- **Scale**: Barrels are scaled to 1.5x for better visibility

#### Animation States:
1. **Flying**: Barrel follows arc trajectory from enemy center to random landing spot
2. **Floating**: Barrel drifts gently on water surface
3. **Attracting**: Barrel moves magnetically toward player
4. **Collecting**: Barrel spins upward before disappearing

### Collection Feedback
- Console logging when barrels are collected
- Ready for sound effects integration (commented TODOs)
- Ready for particle effects integration (commented TODOs)

## Integration Changes

### Modified Files

1. **src/ecs/Component.ts**: Added new component types
2. **src/entities/BarrelFactory.ts**: New file for barrel creation
3. **src/systems/BarrelCollectionSystem.ts**: New file for barrel handling
4. **src/systems/GameStateSystem.ts**: Modified to spawn barrels instead of awarding XP directly
5. **src/config/ModelConfig.ts**: Added barrel model configuration
6. **src/GameWorld.ts**: Integrated BarrelCollectionSystem
7. **src/systems/index.ts**: Exported new BarrelCollectionSystem

### System Execution Order
The BarrelCollectionSystem runs at position 12 in the update cycle, between collision detection and leveling system updates.

## Customization Options

### Adjusting Barrel Behavior
- **Collection Range**: Modify `collectionRange` to make barrels easier/harder to collect
- **Barrel Count**: Change `spawnCount` to control how many barrels drop per enemy
- **XP Distribution**: Adjust `xpValue` to change how much XP each barrel provides
- **Lifespan**: Modify `lifespan` to control how long barrels persist
- **Spawn Spread**: Change `spawnRadius` to control how spread out barrels are

### Visual Customization
- **Flight Time**: Modify flight time range in BarrelFactory (currently 1.0-1.5 seconds)
- **Arc Height**: Adjust arc height range for barrel trajectories (currently 2-4 units)
- **Model Scale**: Modify scale in ModelConfig for different barrel sizes (currently 1.5x)
- **Drift Speed**: Change velocity values in BarrelFactory for different drift behavior
- **Attraction Speed**: Modify `attractionSpeed` in XPBarrelComponent for faster/slower magnetic movement
- **Collection Distance**: Adjust the final collection distance (currently 1.0 unit) for immediate vs delayed pickup
- **Collection Animation**: Modify `collectAnimationDuration` for longer/shorter collection animations

## Future Enhancements

The system is designed with extensibility in mind:

1. **Audio Integration**: TODOs marked for collection sound effects
2. **Visual Effects**: TODOs marked for particle effects on collection
3. **Different Barrel Types**: The system can easily support different barrel types with different XP values
4. **Manual Collection**: Could be modified to require input for collection rather than automatic
5. **Magnetic Collection**: Could add attraction behavior when player is nearby

## Testing

The system maintains the same total XP rewards as the previous direct-award system:
- Regular enemies: 25 XP (5 barrels × 5 XP)
- Boss enemies: 500 XP (25 barrels × 20 XP, maintaining 20x multiplier)

Players now need to actively sail around to collect barrels, adding a layer of gameplay interaction to the progression system.