# Configuration Examples & Testing Guide

Quick reference for testing different game configurations and difficulty levels.

## Current Default Configuration

```typescript
defaultGameStateConfig = {
    wave1: { enemyCount: 5, spawnDistance: 12, xpMultiplier: 1 },
    wave2: { enemyCount: 10, spawnDistance: 12, xpMultiplier: 1 },
    boss: { spawnDistance: 15, xpMultiplier: 20 },
    spawning: { spawnHeightOffset: 0.1, spawnAngleRandomness: true }
}
```

## Available Preset Configurations

### Easy Mode
```typescript
easyGameStateConfig = {
    wave1: { enemyCount: 3, spawnDistance: 12, xpMultiplier: 1 },
    wave2: { enemyCount: 6, spawnDistance: 12, xpMultiplier: 1 },
    boss: { spawnDistance: 15, xpMultiplier: 15 },
    // ... same spawning settings
}
```

### Hard Mode  
```typescript
hardGameStateConfig = {
    wave1: { enemyCount: 8, spawnDistance: 12, xpMultiplier: 1 },
    wave2: { enemyCount: 15, spawnDistance: 12, xpMultiplier: 1 },
    boss: { spawnDistance: 15, xpMultiplier: 25 },
    // ... same spawning settings
}
```

## How to Test Different Configurations

### 1. In Main Application (AppOne.ts)
```typescript
import { easyGameStateConfig, hardGameStateConfig } from './config/GameStateConfig'

// Use easy mode
const gameWorld = new GameWorld(scene, renderer, canvas, camera, easyGameStateConfig)

// Or use hard mode
const gameWorld = new GameWorld(scene, renderer, canvas, camera, hardGameStateConfig)
```

### 2. Runtime Configuration Changes
Open browser console and run:

```javascript
// Access the game world (you may need to expose it globally for testing)
const gameStateSystem = gameWorld.getGameStateSystem()

// View current config
console.log('Current config:', gameStateSystem.getConfig())

// Switch to easy mode (example - you'd need to define these in browser scope)
gameStateSystem.setConfig({
    wave1: { enemyCount: 2, spawnDistance: 15, xpMultiplier: 2 },
    wave2: { enemyCount: 4, spawnDistance: 15, xpMultiplier: 2 },
    boss: { spawnDistance: 20, xpMultiplier: 50 },
    spawning: { spawnHeightOffset: 0.1, spawnAngleRandomness: true }
})
```

### 3. Custom Testing Configurations

#### Speed Test Config (Quick Testing)
```typescript
const speedTestConfig = {
    wave1: { enemyCount: 1, spawnDistance: 8, xpMultiplier: 10 },
    wave2: { enemyCount: 2, spawnDistance: 8, xpMultiplier: 10 },
    boss: { spawnDistance: 10, xpMultiplier: 100 },
    spawning: { spawnHeightOffset: 0.1, spawnAngleRandomness: false }
}
```

#### High XP Config (Level Testing)
```typescript
const highXPConfig = {
    wave1: { enemyCount: 3, spawnDistance: 12, xpMultiplier: 5 },
    wave2: { enemyCount: 5, spawnDistance: 12, xpMultiplier: 5 },
    boss: { spawnDistance: 15, xpMultiplier: 100 },
    spawning: { spawnHeightOffset: 0.1, spawnAngleRandomness: true }
}
```

#### Boss Rush Config (Skip Waves)
```typescript
const bossRushConfig = {
    wave1: { enemyCount: 0, spawnDistance: 12, xpMultiplier: 1 },
    wave2: { enemyCount: 0, spawnDistance: 12, xpMultiplier: 1 },
    boss: { spawnDistance: 12, xpMultiplier: 20 },
    spawning: { spawnHeightOffset: 0.1, spawnAngleRandomness: true }
}
```

## Configuration Testing Checklist

When testing new configurations, verify:

- [ ] **Wave 1**: Correct number of enemies spawn
- [ ] **Wave 2**: Correct number of enemies spawn after Wave 1 complete  
- [ ] **Boss Fight**: Boss spawns after Wave 2 complete
- [ ] **XP Rewards**: Enemies give correct XP amounts
- [ ] **Spawn Distance**: Enemies appear at correct distance
- [ ] **State Transitions**: Game moves between states properly
- [ ] **Player Death**: "New ship offer" appears when player dies
- [ ] **Restart**: Game resets properly when clicking "Get it"

## Console Commands for Testing

Add these to browser console for quick testing:

```javascript
// Quick restart
gameWorld.getGameStateSystem().restartGame()

// Check current state  
console.log('Current state:', 
    gameWorld.getGameStateSystem().getGameState()?.currentState)

// Get alive enemy count
console.log('Alive enemies:', 
    world.getEntitiesWithComponents(['enemy', 'health'])
    .filter(e => !e.getComponent('health').isDead).length)
```

## Common Configuration Patterns

### For Balancing
- Start with `enemyCount: 1` for each wave to test mechanics
- Gradually increase until difficulty feels right
- Adjust `xpMultiplier` to match difficulty increase

### For Playtesting
- Use `spawnAngleRandomness: false` for predictable testing
- Reduce `spawnDistance` to speed up encounters  
- Increase `xpMultiplier` to test leveling quickly

### For Showcase/Demo
- Lower enemy counts for smoother demo flow
- Higher `xpMultiplier` for impressive level-ups
- Closer `spawnDistance` for immediate action

## Performance Considerations

- **Max Recommended**: `enemyCount` ≤ 20 per wave for mobile
- **Spawn Distance**: Keep ≥ 8 to avoid spawn-camping
- **XP Multipliers**: Values > 100 may cause level-skipping issues

Remember: All values are hot-swappable during development for rapid iteration!