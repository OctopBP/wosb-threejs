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
- **Purpose**: Handles barrel collection, floating animation, and XP awarding
- **Features**:
  - Range-based collection detection
  - Smooth floating animation using sine waves
  - Automatic barrel cleanup after collection or expiration
  - XP awarding through the existing LevelingSystem

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

### Barrel Behavior
- **Static Positioning**: Barrels remain at water level (y=0) without floating animation
- **Magnetic Collection**: When player enters collection range (3 units), barrels are magnetically attracted to the ship
- **Smooth Movement**: Barrels move toward player at configurable speed (8.0 units/second)
- **Scale**: Barrels are scaled to 1.5x for better visibility
- **Drift**: Small random drift velocity when not being attracted

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
- **Float Speed**: Adjust `floatSpeed` for faster/slower bobbing animation
- **Model Scale**: Modify scale in ModelConfig for different barrel sizes (currently 1.5x)
- **Drift Speed**: Change velocity values in BarrelFactory for different drift behavior
- **Attraction Speed**: Modify `attractionSpeed` in XPBarrelComponent for faster/slower magnetic movement
- **Collection Distance**: Adjust the final collection distance (currently 1.0 unit) for immediate vs delayed pickup

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