# Leveling System Implementation

This document describes the leveling system implemented for Task 5, which provides XP tracking, progression, visual upgrades, and stat improvements for a 6-level structure.

## Architecture Overview

The leveling system is built using an Entity-Component-System (ECS) architecture and consists of several key components:

### Core Components

1. **XPComponent** (`src/components/XPComponent.ts`)
   - Tracks current XP, level, and total XP earned
   - Provides methods for adding XP and managing level state

2. **ShipStatsComponent** (`src/components/ShipStatsComponent.ts`)
   - Manages ship statistics (speed, health, firepower, etc.)
   - Handles stat upgrades and damage calculation
   - Maintains both base stats and current modified stats

3. **VisualUpgradeComponent** (`src/components/VisualUpgradeComponent.ts`)
   - Tracks visual appearance upgrades (sails, cannons, hull color, etc.)
   - Manages decorations and visual progression

### Core Systems

1. **LevelingSystem** (`src/systems/LevelingSystem.ts`)
   - Handles XP gain and level progression logic
   - Applies stat and visual upgrades upon level up
   - Provides event callbacks for level up effects
   - Includes utility methods for UI integration

### Configuration

1. **LevelingConfig** (`src/config/LevelingConfig.ts`)
   - Configurable progression curves (linear, polynomial, custom)
   - Level-specific upgrade definitions
   - Progression calculation utilities

## Feature Highlights

### 🎯 Configurable Progression Curves
- **Linear**: Simple fixed XP increases per level
- **Polynomial**: Exponential curve with configurable exponent
- **Custom**: Manually defined XP thresholds per level

### 📈 Six-Level Progression
Each level provides meaningful upgrades:

- **Level 1**: Starting ship - Basic configuration
- **Level 2**: Enhanced sails and improved cannons (+1 speed, +2 firepower)
- **Level 3**: Additional cannons and reinforced hull (+2 speed, +4 firepower, +25 health)
- **Level 4**: Elite sails and faster reload (+3 speed, +6 firepower, +50 health, +0.5 fire rate)
- **Level 5**: Battle-hardened veteran ship (+5 speed, +10 firepower, +80 health, +1.0 fire rate, +15 range)
- **Level 6**: Legendary Admiral Ship - Maximum power! (+8 speed, +15 firepower, +120 health, +1.5 fire rate, +25 range)

### 🎨 Visual Progression
- Progressive sail upgrades (4 types)
- Increasing cannon count (2 → 8 cannons)
- Hull color changes reflecting ship status
- Flag upgrades showing rank progression
- Decorative elements (gilt trim, figurehead, battle scars, admiral flag)

### ⚙️ Data-Driven Design
- All progression curves externalized in configuration
- Easy balancing and modification without code changes
- Modular upgrade system for future expansion

## API Usage

### Creating a Player Entity
```typescript
import { PlayerFactory } from './entities/PlayerFactory';
import { World } from './ecs/World';

const world = new World();
const player = PlayerFactory.createPlayer(world, {
    initialLevel: 1,
    initialXP: 0
});
```

### Awarding XP
```typescript
import { LevelingSystem } from './systems/LevelingSystem';

const levelingSystem = new LevelingSystem(world);
world.addSystem(levelingSystem);

// Award XP to player
levelingSystem.addXP(player.id, 100);
```

### Level Up Events
```typescript
levelingSystem.onLevelUp((event) => {
    console.log(`Player reached level ${event.newLevel}!`);
    console.log(`Upgrade: ${event.upgrade.description}`);
    
    // Trigger visual effects, sounds, UI updates, etc.
});
```

### UI Integration
```typescript
// Get current XP progress for UI bars
const progress = levelingSystem.getXPProgress(player.id);
console.log(`XP: ${progress.current}/${progress.required} (${progress.percentage}%)`);

// Check current level
const level = levelingSystem.getCurrentLevel(player.id);

// Check if max level reached
const isMaxLevel = levelingSystem.isMaxLevel(player.id);
```

## Integration with Game Systems

The leveling system is designed to integrate seamlessly with other game systems:

### Combat System Integration
```typescript
// When enemies are defeated, award XP
gameWorld.awardXP(50); // Award 50 XP for enemy kill

// Ship stats are automatically applied to combat calculations
const shipStats = player.getComponent(ShipStatsComponent);
const damage = shipStats.currentStats.firepower; // Uses upgraded firepower
```

### Visual System Integration
```typescript
// Visual upgrades are automatically applied
const visuals = player.getComponent(VisualUpgradeComponent);
const hullColor = visuals.currentVisuals.hullColor; // Current hull color
const cannonCount = visuals.currentVisuals.cannonCount; // Current cannon count
```

## Demo Controls

The current implementation includes keyboard controls for testing:

- **X**: Award 50 XP
- **C**: Award 200 XP (for quick testing)
- **D**: Debug current state (shows all component data)
- **R**: Reset to level 1
- **F**: Force to max level (level 6)

## Technical Features

### 🔄 Multiple Level-Ups
The system handles cases where a single XP award causes multiple level increases, processing each level up correctly with proper XP carryover.

### 🛡️ Robust Error Handling
- Safe entity lookups with null checks
- Graceful handling of missing components
- Error boundaries in callback systems

### 🔧 Extensible Design
- Easy to add new stat types
- Simple to create new visual upgrade categories
- Modular system allows for future enhancements

### 📊 Performance Optimized
- Efficient entity queries using ECS patterns
- Minimal per-frame overhead
- Lazy evaluation of progression calculations

## Configuration Customization

### Changing Progression Curve
```typescript
// In LevelingConfig.ts
export const LEVELING_CONFIG = {
    progressionCurve: {
        type: 'polynomial',
        baseXP: 100,      // Base XP requirement
        multiplier: 1.5,  // Curve steepness
        exponent: 1.8     // Exponential growth rate
    }
};
```

### Adding New Upgrades
```typescript
// Add new level upgrade
{
    level: 7,
    statModifiers: {
        speed: 10,
        firepower: 20
    },
    visualUpgrades: {
        sailType: 4,
        decorations: ['legendary_crest']
    },
    description: 'Mythical Ship of Legends'
}
```

## Future Integration Points

The leveling system provides hooks for:

- **Visual Effects**: Level up particles, screen flashes, etc.
- **Audio System**: Level up sounds, ambient audio changes
- **UI System**: XP bars, level indicators, upgrade notifications
- **Save System**: Persistence of player progression
- **Analytics**: Tracking progression metrics for balancing

## Dependencies

The leveling system requires:
- ECS architecture (Entity, Component, System, World)
- Babylon.js for scene integration
- TypeScript for type safety

## Files Created

```
src/
├── ecs/
│   ├── Component.ts     # Base component class
│   ├── Entity.ts        # Entity management
│   ├── System.ts        # Base system class
│   ├── World.ts         # ECS world manager
│   └── index.ts         # ECS exports
├── components/
│   ├── XPComponent.ts           # XP tracking
│   ├── ShipStatsComponent.ts    # Ship statistics
│   └── VisualUpgradeComponent.ts # Visual upgrades
├── systems/
│   └── LevelingSystem.ts        # Core leveling logic
├── config/
│   └── LevelingConfig.ts        # Progression configuration
├── entities/
│   └── PlayerFactory.ts         # Player entity creation
└── GameWorld.ts                 # Game integration layer
```

This leveling system fully implements the requirements from Task 5, providing a robust, configurable, and extensible foundation for character progression in the ship combat game.