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

## Spawn Area Configuration

Control where enemies can spawn by defining allowed areas. Enemies will still spawn around the player within the specified distance, but only if the spawn position falls within the allowed areas.

### Basic Setup
```typescript
import { SpawnArea } from './src/config/EnemyConfig'

// Define custom spawn areas
const customSpawnAreas: SpawnArea[] = [
    {
        name: 'North Ocean',
        minX: -20,
        maxX: 20,
        minZ: 10,
        maxZ: 40,
    },
    {
        name: 'South Ocean', 
        minX: -20,
        maxX: 20,
        minZ: -40,
        maxZ: -10,
    }
]

// Apply to wave configuration
const gameConfig = {
    wave1: { 
        enemyCount: 3,
        minSpawnDistance: 25,
        maxSpawnDistance: 35,
        allowedAreas: customSpawnAreas
    },
    // ... other waves
}
```

### Example Configurations

#### 1. Central Arena (Safe Borders)
```typescript
const centralArenaAreas: SpawnArea[] = [
    {
        name: 'Central Arena',
        minX: -15,
        maxX: 15,
        minZ: -15, 
        maxZ: 15,
    }
]
```

#### 2. Corner Ambush Points
```typescript
const cornerAmbushAreas: SpawnArea[] = [
    {
        name: 'Northeast Corner',
        minX: 20,
        maxX: 40,
        minZ: 20,
        maxZ: 40,
    },
    {
        name: 'Southwest Corner',
        minX: -40,
        maxX: -20,
        minZ: -40,
        maxZ: -20,
    }
]
```

#### 3. Ring Formation (No Center Spawns)
```typescript
const ringFormationAreas: SpawnArea[] = [
    {
        name: 'North Ring',
        minX: -30,
        maxX: 30,
        minZ: 15,
        maxZ: 30,
    },
    {
        name: 'East Ring',
        minX: 15,
        maxX: 30,
        minZ: -15,
        maxZ: 15,
    },
    {
        name: 'South Ring',
        minX: -30,
        maxX: 30,
        minZ: -30,
        maxZ: -15,
    },
    {
        name: 'West Ring',
        minX: -30,
        maxX: -15,
        minZ: -15,
        maxZ: 15,
    }
]
```

#### 4. Progressive Area Expansion
```typescript
// Wave 1: Close quarters
const wave1Areas: SpawnArea[] = [
    {
        name: 'Inner Circle',
        minX: -10,
        maxX: 10,
        minZ: -10,
        maxZ: 10,
    }
]

// Wave 2: Expanded battlefield  
const wave2Areas: SpawnArea[] = [
    {
        name: 'Expanded Ocean',
        minX: -25,
        maxX: 25,
        minZ: -25,
        maxZ: 25,
    }
]

// Boss: Full area access
const bossAreas: SpawnArea[] = [
    {
        name: 'Full Ocean',
        minX: -40,
        maxX: 40,
        minZ: -40,
        maxZ: 40,
    }
]
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
import { 
    cornerAmbushConfig, 
    ringFormationConfig, 
    progressiveExpansionConfig,
    corridorCombatConfig 
} from './config/CustomGameConfigs'

// Use easy mode
const gameWorld = new GameWorld(scene, renderer, canvas, camera, easyGameStateConfig)

// Or use hard mode
const gameWorld = new GameWorld(scene, renderer, canvas, camera, hardGameStateConfig)

// Or try custom spawn area configurations
const gameWorld = new GameWorld(scene, renderer, canvas, camera, cornerAmbushConfig)
const gameWorld = new GameWorld(scene, renderer, canvas, camera, ringFormationConfig)
const gameWorld = new GameWorld(scene, renderer, canvas, camera, progressiveExpansionConfig)
const gameWorld = new GameWorld(scene, renderer, canvas, camera, corridorCombatConfig)
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
- [ ] **Spawn Areas**: Enemies only spawn within defined allowed areas
- [ ] **Spawn Area Validation**: Warning messages appear when no valid spawn position found
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

// Test spawn area validation
import { isPositionInAnyAllowedArea, defaultSpawnAreas } from './src/config/EnemyConfig'

// Check if a position is valid for spawning
console.log('Position (10, 10) valid:', 
    isPositionInAnyAllowedArea(10, 10, defaultSpawnAreas))

// Get enemy positions to verify they're in allowed areas
world.getEntitiesWithComponents(['enemy', 'position']).forEach((enemy, i) => {
    const pos = enemy.getComponent('position')
    console.log(`Enemy ${i}: (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`)
})
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
- **Spawn Areas**: Very small allowed areas may cause performance issues due to spawn retries
- **Area Count**: More than 5-10 spawn areas may impact performance during spawn validation

### Spawn Area Best Practices

- **Minimum Size**: Each spawn area should be at least 20x20 units for reliable spawning
- **Player Coverage**: Ensure spawn areas cover enough space around potential player positions
- **Overlap**: Overlapping spawn areas are allowed and can create more flexible spawning
- **Distance Match**: Spawn areas should accommodate the configured `minSpawnDistance` and `maxSpawnDistance`

Remember: All values are hot-swappable during development for rapid iteration!