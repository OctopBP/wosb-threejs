# Game State Architecture Documentation

This document explains the refactored, modular game state management system that replaces the monolithic approach with configurable, maintainable state handlers.

## Overview

The game state system has been refactored into:
- **Configurable settings** via `GameStateConfig`
- **Modular state handlers** that handle specific game states
- **Clean separation of concerns** for better maintainability
- **Easy difficulty customization** through preset configurations

## Architecture Components

### 1. Configuration System (`src/config/GameStateConfig.ts`)

All game state settings are centralized in configuration objects:

```typescript
interface GameStateConfig {
    wave1: WaveConfig
    wave2: WaveConfig  
    boss: BossConfig
    spawning: SpawningConfig
}
```

**Available Presets:**
- `defaultGameStateConfig` - Balanced gameplay
- `easyGameStateConfig` - Reduced enemy counts
- `hardGameStateConfig` - Increased enemy counts and rewards

**Configuration Options:**
```typescript
wave1: {
    enemyCount: 5,        // Number of enemies in wave 1
    spawnDistance: 12,    // Distance from player to spawn
    xpMultiplier: 1,      // XP multiplier for wave 1 enemies
}
```

### 2. State Handler System (`src/systems/states/`)

Each game state has its own dedicated handler:

#### Base State Handler (`BaseGameState.ts`)
- Provides common functionality for all states
- Helper methods for enemy spawning and player queries
- Abstract interface for state implementation

#### Individual State Handlers:
- **`Wave1State.ts`** - Manages first enemy wave
- **`Wave2State.ts`** - Manages second enemy wave  
- **`BossFightState.ts`** - Manages boss encounter
- **`NewShipOfferState.ts`** - Handles end-game UI state

### 3. Updated GameStateSystem (`src/systems/GameStateSystem.ts`)

The main system now:
- Uses configuration instead of hardcoded values
- Delegates state logic to appropriate handlers
- Supports runtime configuration changes
- Maintains clean separation between state logic and system management

## Key Features

### ⚙️ **Complete Configurability**
No more hardcoded values! Everything is configurable:

```typescript
// Before: Hardcoded
if (gameState.wave1EnemiesSpawned < 5) {

// After: Configurable  
if (gameState.wave1EnemiesSpawned < waveConfig.enemyCount) {
```

### 🏗️ **Modular State Logic**
Each state is self-contained:

```typescript
export class Wave1State extends BaseGameState {
    handle(gameState, config, world, levelingSystem): string | null {
        // Wave 1 specific logic
        const waveConfig = config.wave1
        // ...
        return nextState // or null to stay
    }
}
```

### 🎯 **Easy Difficulty Changes**
Switch configurations at runtime:

```typescript
// In GameWorld or main application
gameWorld.setGameDifficulty(easyGameStateConfig)
gameWorld.setGameDifficulty(hardGameStateConfig) 
gameWorld.setGameDifficulty(customConfig)
```

### 🔧 **Runtime Configuration**
Access and modify settings on the fly:

```typescript
const gameStateSystem = gameWorld.getGameStateSystem()
const currentConfig = gameStateSystem.getConfig()

// Modify and apply new config
const newConfig = { ...currentConfig }
newConfig.wave1.enemyCount = 8
gameStateSystem.setConfig(newConfig)
```

## Usage Examples

### Custom Difficulty Configuration

```typescript
const myCustomConfig: GameStateConfig = {
    wave1: {
        enemyCount: 3,        // Easy start
        spawnDistance: 15,    // Further spawning
        xpMultiplier: 2,      // Double XP
    },
    wave2: {
        enemyCount: 12,       // Harder second wave
        spawnDistance: 10,    // Closer spawning
        xpMultiplier: 1.5,    // Extra XP
    },
    boss: {
        spawnDistance: 20,    // Dramatic entrance
        xpMultiplier: 50,     // Massive XP reward
    },
    spawning: {
        spawnHeightOffset: 0.1,
        spawnAngleRandomness: false, // Predictable spawning
    },
}

// Apply configuration
const gameWorld = new GameWorld(scene, renderer, canvas, camera, myCustomConfig)
```

### Dynamic Difficulty Adjustment

```typescript
// Start with easy mode
let gameWorld = new GameWorld(scene, renderer, canvas, camera, easyGameStateConfig)

// Later, increase difficulty based on player performance
if (playerScore > 1000) {
    gameWorld.setGameDifficulty(hardGameStateConfig)
    console.log('Difficulty increased!')
}
```

### A/B Testing Different Configurations

```typescript
const configs = [defaultGameStateConfig, easyGameStateConfig, hardGameStateConfig]
const randomConfig = configs[Math.floor(Math.random() * configs.length)]

const gameWorld = new GameWorld(scene, renderer, canvas, camera, randomConfig)
```

## Benefits of Refactored Architecture

### 🧹 **Clean Code**
- **Single Responsibility**: Each state handler does one thing
- **No Hardcoded Values**: Everything configurable
- **Easy Testing**: Individual state handlers can be unit tested
- **Better Maintainability**: Changes to one state don't affect others

### 🚀 **Flexibility**
- **Runtime Configuration**: Change difficulty mid-game
- **Easy Balancing**: Modify numbers without code changes  
- **Preset System**: Quick difficulty switching
- **Extensible**: Easy to add new states or configuration options

### 🎮 **Game Design Benefits**
- **Rapid Iteration**: Designers can tweak configs without dev involvement
- **A/B Testing**: Easy to test different balance scenarios
- **Player Customization**: Could expose difficulty settings to players
- **Data-Driven Design**: Game balance driven by configuration files

## Adding New States

To add a new game state:

1. **Create State Handler**:
```typescript
// src/systems/states/MyNewState.ts
export class MyNewState extends BaseGameState {
    handle(gameState, config, world, levelingSystem): string | null {
        // Your state logic here
        return nextState || null
    }
}
```

2. **Update Configuration** (if needed):
```typescript
// Add to GameStateConfig interface if new settings needed
interface GameStateConfig {
    // ... existing
    myNewState?: MyNewStateConfig
}
```

3. **Register Handler**:
```typescript
// In GameStateSystem.initializeStateHandlers()
this.stateHandlers.set('myNewState', new MyNewState())
```

4. **Add to State Transitions**:
```typescript
// In appropriate state handler
return 'myNewState' // Transition to new state
```

## File Structure

```
src/
├── config/
│   ├── GameStateConfig.ts       # All state configurations
│   └── BossConfig.ts           # Boss-specific settings
├── systems/
│   ├── GameStateSystem.ts      # Main state manager
│   └── states/
│       ├── index.ts            # State exports
│       ├── BaseGameState.ts    # Base state functionality
│       ├── Wave1State.ts       # Wave 1 handler
│       ├── Wave2State.ts       # Wave 2 handler
│       ├── BossFightState.ts   # Boss fight handler
│       └── NewShipOfferState.ts # End game handler
```

This refactored architecture provides a solid foundation for:
- Easy game balancing and tuning
- Rapid prototyping of new gameplay modes
- A/B testing different configurations  
- Clean, maintainable, and extensible code

The system maintains backward compatibility while providing much more flexibility for future development.