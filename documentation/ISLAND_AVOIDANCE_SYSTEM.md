# Hybrid Island Avoidance System

## Overview

The Hybrid Island Avoidance System provides realistic collision detection and navigation for ships around islands. It combines physics-based collision for the player ship with grid-based pathfinding for enemy ships.

## Features

### Player Ship Collision
- **Physics-based collision detection** prevents player from moving through islands
- **Smooth sliding behavior** allows player to slide along island edges
- **Sphere collision detection** provides accurate and performant collision checking
- **Automatic collision resolution** pushes player to safe distance when too close

### Enemy Ship Pathfinding  
- **Grid-based navigation** divides the world into a 2D grid
- **A* pathfinding algorithm** finds optimal routes around islands
- **Smart waypoint following** with configurable reach distances
- **Fallback direct movement** when pathfinding fails

### Performance Optimization
- **Configurable grid resolution** balances accuracy vs performance
- **Pathfinding cooldown** limits recalculation frequency
- **Efficient collision checks** only process static environment objects
- **Optimized A* implementation** with proper heuristics and neighbor checking

## Configuration

### Island Data (`src/config/IslandConfig.ts`)

```typescript
// Configure individual islands
export const ISLAND_DATA: IslandData[] = [
    {
        name: 's4',
        position: { x: -32.89, y: 0.01, z: -20.77 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        collisionRadius: 8.0, // Collision detection radius
    },
    // ... more islands
]

// Configure pathfinding grid
export const PATHFINDING_CONFIG = {
    gridSize: 2.0, // Size of each grid cell in world units
    worldBounds: {
        minX: -80, maxX: 80,
        minZ: -40, maxZ: 100,
    },
    islandPadding: 2.0, // Extra padding around islands for safety
}
```

### Component Configuration

```typescript
// Pathfinding component settings (in EnemyFactory.ts)
const pathfinding: PathfindingComponent = {
    waypointReachDistance: 2.0, // Distance to consider waypoint reached
    pathfindingCooldown: 1.0, // Minimum seconds between path recalculations
}
```

## System Architecture

### Components

#### PathfindingComponent
```typescript
interface PathfindingComponent {
    currentPath: { x: number; z: number }[] | null // Current navigation path
    currentWaypointIndex: number // Index of target waypoint
    waypointReachDistance: number // Distance threshold for waypoint completion
    lastPathfindTime: number // Timestamp of last pathfinding calculation
    pathfindingCooldown: number // Minimum time between recalculations
}
```

### Systems

#### EnvironmentCollisionSystem
- **Purpose**: Handles player collision with static environment objects
- **Execution Order**: After MovementSystem, before WaveRockingSystem
- **Features**:
  - Predictive collision detection
  - Smooth sliding along obstacles
  - Automatic position correction
  - Support for both sphere and box colliders

#### PathfindingSystem  
- **Purpose**: Provides A* pathfinding services to other systems
- **Initialization**: Creates navigation grid on startup
- **Features**:
  - Grid-based world representation
  - A* algorithm with 8-directional movement
  - Automatic goal adjustment for blocked destinations
  - Debug visualization support

#### EnemyAISystem (Enhanced)
- **Purpose**: Controls enemy movement using pathfinding
- **Features**:
  - Pathfinding integration with fallback to direct movement
  - Intelligent waypoint following
  - Performance-optimized path recalculation
  - Smooth transition between waypoints

## Grid System

### Grid Generation
1. **Initialize grid** with all cells marked as "sea" (navigable)
2. **Mark island cells** as "island" (blocked) based on collision radius + padding
3. **Validate bounds** to ensure grid covers the entire game world

### Coordinate Conversion
```typescript
// Convert world coordinates to grid coordinates
const gridPos = worldToGrid(worldX, worldZ)

// Convert grid coordinates back to world coordinates  
const worldPos = gridToWorld(gridX, gridZ)
```

### Pathfinding Process
1. **Validate start/goal positions** - ensure they're within grid bounds
2. **Adjust blocked goals** - find nearest navigable cell if goal is blocked
3. **Run A* algorithm** - find optimal path avoiding islands
4. **Convert to world coordinates** - return path as world positions
5. **Cache result** - store path in PathfindingComponent

## Usage Examples

### Configuring Island Collision
```typescript
// Adjust collision radius for an island
ISLAND_DATA[0].collisionRadius = 10.0 // Larger collision area

// Modify grid settings for better performance
PATHFINDING_CONFIG.gridSize = 3.0 // Larger cells = faster pathfinding
PATHFINDING_CONFIG.islandPadding = 1.0 // Less padding = closer navigation
```

### Debugging Pathfinding
```typescript
// Access navigation grid for visualization
const pathfindingSystem = gameWorld.getPathfindingSystem()
const grid = pathfindingSystem.getNavigationGrid()

// Check if a position is navigable
const isNavigable = pathfindingSystem.isNavigable(worldX, worldZ)

// Manual pathfinding test
const path = pathfindingSystem.findPath(startX, startZ, goalX, goalZ)
```

### Performance Tuning
```typescript
// Reduce pathfinding frequency for better performance
pathfinding.pathfindingCooldown = 2.0 // Recalculate every 2 seconds

// Increase waypoint reach distance for smoother movement
pathfinding.waypointReachDistance = 3.0 // Larger reach distance

// Adjust grid resolution
PATHFINDING_CONFIG.gridSize = 4.0 // Coarser grid for better performance
```

## Performance Characteristics

### Grid Size Impact
- **Smaller cells** (1.0-2.0): More accurate pathfinding, higher memory usage
- **Larger cells** (3.0-4.0): Faster pathfinding, less memory, slightly less accurate

### Pathfinding Frequency
- **High frequency** (0.5s): Very responsive, higher CPU usage
- **Low frequency** (2.0s): Good performance, slightly less responsive

### Memory Usage
- **Grid**: ~80x70 cells = 5,600 bytes (CellType enum)
- **Paths**: ~20 waypoints per enemy = 160 bytes per enemy
- **Total**: Minimal memory footprint

## Troubleshooting

### Player Getting Stuck
- Check `collisionRadius` values in `ISLAND_DATA`
- Verify `islandPadding` is sufficient
- Ensure collision shapes match visual island boundaries

### Enemies Not Navigating
- Verify `PathfindingSystem` is initialized before `EnemyAISystem`
- Check that enemies have `PathfindingComponent`
- Ensure `setPathfindingSystem()` is called on `EnemyAISystem`

### Performance Issues
- Increase `gridSize` in `PATHFINDING_CONFIG`
- Reduce pathfinding frequency with higher `pathfindingCooldown`
- Limit number of simultaneous enemies

### Pathfinding Failures
- Check world bounds in `PATHFINDING_CONFIG`
- Verify start/goal positions are within grid
- Ensure sufficient navigable area around islands

## Future Enhancements

### Potential Improvements
- **Dynamic obstacles**: Support for moving obstacles and temporary blockages
- **Multi-level pathfinding**: Different path types for different ship sizes
- **Formation pathfinding**: Group movement coordination
- **Hierarchical pathfinding**: Multi-resolution grids for large worlds
- **Flow field pathfinding**: Optimized for many units moving to same goal

### Configuration Extensions
- **Ship-specific collision radii**: Different collision sizes per ship type
- **Terrain-based movement costs**: Slower movement in certain areas
- **Dynamic grid updates**: Real-time grid modification support