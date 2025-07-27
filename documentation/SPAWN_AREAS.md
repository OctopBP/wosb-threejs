# Enemy Spawn Areas System

The spawn areas system allows you to control where enemies can spawn by defining rectangular areas in the game world. Enemies will still spawn around the player within the configured distance, but only if the spawn position falls within one of the allowed areas.

## How It Works

1. **Distance-Based Spawning**: Enemies spawn around the player at a distance between `minSpawnDistance` and `maxSpawnDistance`
2. **Area Validation**: The spawn position is then checked against all defined `allowedAreas`
3. **Retry Logic**: If the position is outside all allowed areas, the system tries again with a new random position
4. **Fallback**: After 50 attempts, the system will spawn the enemy anyway to prevent infinite loops

## Configuration

### Basic Usage

```typescript
import type { SpawnArea } from './src/config/EnemyConfig'

const customAreas: SpawnArea[] = [
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

const gameConfig = {
    wave1: { 
        enemyCount: 3,
        minSpawnDistance: 25,
        maxSpawnDistance: 35,
        allowedAreas: customAreas
    }
}
```

### Per-Wave Configuration

You can define different spawn areas for each wave:

```typescript
// Wave 1: Enemies spawn close to player
const wave1Areas = [{ name: 'Inner', minX: -15, maxX: 15, minZ: -15, maxZ: 15 }]

// Wave 2: Battlefield expands
const wave2Areas = [{ name: 'Outer', minX: -30, maxX: 30, minZ: -30, maxZ: 30 }]

const config = {
    wave1: { allowedAreas: wave1Areas, ... },
    wave2: { allowedAreas: wave2Areas, ... }
}
```

## Pre-built Configurations

The game includes several pre-built configurations in `src/config/CustomGameConfigs.ts`:

### 1. Corner Ambush (`cornerAmbushConfig`)
- Enemies spawn only from the four corners of the map
- Creates tactical positioning challenges
- Forces players to watch multiple directions

### 2. Ring Formation (`ringFormationConfig`) 
- Enemies spawn in a ring around the center
- No spawns in the immediate center area
- Creates a "surrounded" feeling

### 3. Progressive Expansion (`progressiveExpansionConfig`)
- Wave 1: Small central area
- Wave 2: Expanded area
- Boss: Full map access
- Gradually increases battlefield size

### 4. Corridor Combat (`corridorCombatConfig`)
- Two vertical corridors on left and right sides
- Creates lane-based combat
- Forces strategic positioning

## Technical Details

### Coordinate System
- X-axis: Left (-) to Right (+)
- Z-axis: Back (-) to Front (+)
- Y-axis: Down (-) to Up (+) (not used for spawn areas)

### Area Definition
```typescript
interface SpawnArea {
    name: string        // Descriptive name for debugging
    minX: number       // Left boundary
    maxX: number       // Right boundary  
    minZ: number       // Back boundary
    maxZ: number       // Front boundary
}
```

### Validation Functions
- `isPositionInArea(x, z, area)`: Check if a position is within a single area
- `isPositionInAnyAllowedArea(x, z, areas)`: Check if a position is within any of the allowed areas

## Best Practices

### Area Sizing
- **Minimum size**: 20x20 units for reliable spawning
- **Distance compatibility**: Ensure areas accommodate your `minSpawnDistance` and `maxSpawnDistance`
- **Player coverage**: Areas should cover space around potential player positions

### Performance
- **Max areas**: Keep under 5-10 areas for best performance
- **Avoid tiny areas**: Very small areas cause excessive spawn retries
- **Overlap**: Overlapping areas are fine and increase spawn flexibility

### Gameplay Design
- **Safe zones**: Leave gaps between areas to create safe passages
- **Tactical positioning**: Use area shapes to encourage specific player behavior
- **Progressive difficulty**: Expand or contract areas between waves

## Debugging

### Console Commands
```javascript
// Check if a position is valid
console.log('Valid spawn:', isPositionInAnyAllowedArea(10, 10, areas))

// View enemy positions
world.getEntitiesWithComponents(['enemy', 'position']).forEach((enemy, i) => {
    const pos = enemy.getComponent('position')
    console.log(`Enemy ${i}: (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`)
})
```

### Log Messages
The system logs helpful messages:
- `🎯 Enemy spawned at (x, z) within allowed area after N attempts` - Successful spawn
- `⚠️ Could not find valid spawn position after 50 attempts` - Fallback spawn used

## Examples in Action

### Testing Different Configurations
```typescript
// In AppOne.ts
import { cornerAmbushConfig } from './config/CustomGameConfigs'

// Replace the default config
const gameWorld = new GameWorld(scene, renderer, canvas, camera, cornerAmbushConfig)
```

### Creating Custom Areas
```typescript
// Asymmetric battlefield - enemies favor one side
const asymmetricAreas: SpawnArea[] = [
    {
        name: 'Heavy Side',
        minX: 10,
        maxX: 40,
        minZ: -30,
        maxZ: 30,
    },
    {
        name: 'Light Side',  
        minX: -20,
        maxX: -10,
        minZ: -15,
        maxZ: 15,
    }
]
```

The spawn areas system gives you precise control over enemy positioning while maintaining the dynamic, player-centered spawning that keeps the action focused around the player's current position.