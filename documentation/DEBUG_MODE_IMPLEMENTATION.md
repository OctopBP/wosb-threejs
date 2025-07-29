# Debug Mode Implementation

This document describes the debug mode implementation that allows you to visualize various game mechanics and debug information in real-time.

## Overview

The debug mode provides visual gizmos to help understand game mechanics, collision detection, weapon systems, and entity movement. It includes a comprehensive toggle system accessible through the inspector menu.

## Features

### 1. Debug Visualization Controls

Located in the **"Debug Visualization"** folder in the inspector menu (lil-gui), provides:

* **Enable Debug Mode**: Master toggle to enable/disable all debug features
* **Show Shooting Points**: Visualize weapon firing positions on ships
* **Show Collision Shapes**: Display collision boundaries around entities
* **Show Weapon Range**: Show weapon firing and detection ranges
* **Show Velocity Vectors**: Display movement velocity as directional arrows
* **Show Restricted Zones**: Display restricted areas where player cannot enter
* **Show Spawn Zones**: Display areas where enemies can spawn
* **Enable All Debug**: Quick button to enable all debug features
* **Disable All Debug**: Quick button to disable all debug features

### 2. Visual Gizmos

#### Shooting Points

* **Color**: Red spheres (🔴)
* **Purpose**: Shows exactly where projectiles spawn from each ship
* **Details**: Small spheres positioned at weapon shooting points, rotated with the ship

#### Collision Shapes

* **Color**: Green wireframe shapes (🟢)
* **Purpose**: Visualizes the collision detection boundaries
* **Details**:
  + **Boxes**: For ships (1.6x1.6x1.6 units for regular ships, 2.4x2.4x2.4 for boss)
  + **Spheres**: For bullets (0.2 radius)
  + Supports configurable collision shapes with optional offsets

#### Weapon Range

* **Color**: Blue rings for firing range (🔵), Orange rings for detection range (🟠)
* **Purpose**: Shows weapon firing range and auto-targeting detection range
* **Details**:
  + Blue rings show the maximum firing distance
  + Orange rings show auto-targeting detection range (when different from firing range)
  + Rings are positioned flat on the ground plane

#### Velocity Vectors

* **Color**: Yellow lines (🟡)
* **Purpose**: Shows movement direction and speed
* **Details**:
  + Lines start from entity position and extend in movement direction
  + Length represents velocity magnitude (scaled for visibility)
  + Only shown for entities with significant movement (>0.1 units/frame)

#### Restricted Zones

* **Color**: Red wireframe boxes (🔴)
* **Purpose**: Shows areas where the player cannot enter
* **Details**: Wireframe boxes positioned at restricted zone boundaries

#### Spawn Zones

* **Color**: Green wireframe boxes (🟢)
* **Purpose**: Shows areas where enemies can spawn
* **Details**: Wireframe boxes positioned at spawn zone boundaries

## Architecture

### Components

* **DebugComponent**: Stores debug state and feature toggles

```typescript
  interface DebugComponent {
    type: 'debug'
    enabled: boolean
    showShootingPoints: boolean
    showCollisionShapes: boolean
    showWeaponRange: boolean
    showVelocityVectors: boolean
    showRestrictedZones: boolean
    showSpawnZones: boolean
  }
  ```

### Systems

* **DebugSystem**: Renders all debug visualizations
  + Manages debug gizmo lifecycle (creation/cleanup)
  + Processes all entities with position components
  + Applies different materials for different gizmo types
  + Handles proper cleanup to prevent memory leaks

### Entities

* **Debug Entity**: Single global entity that controls debug state
  + Created in `GameWorld.init()`
  + Managed by `DebugFactory.createDebugEntity()`

## Integration Points

### GameWorld.ts

* Initializes DebugSystem and debug entity
* Provides public methods for toggling debug features:
  + `setDebugMode(enabled: boolean)`
  + `toggleDebugShootingPoints(enabled: boolean)`
  + `toggleDebugCollisionShapes(enabled: boolean)`
  + `toggleDebugWeaponRange(enabled: boolean)`
  + `toggleDebugVelocityVectors(enabled: boolean)`
  + `toggleDebugRestrictedZones(enabled: boolean)`
  + `toggleDebugSpawnZones(enabled: boolean)`

### AppOne.ts

* Integrates debug controls into the existing lil-gui inspector
* Provides console logging for debug state changes
* Includes bulk enable/disable functionality

## Usage

1. **Open the Inspector**: The debug controls appear automatically in development mode
2. **Navigate to Debug Visualization**: Find the folder in the inspector menu
3. **Enable Debug Mode**: Toggle the master switch to start debugging
4. **Toggle Individual Features**: Enable specific visualizations as needed
5. **Quick Controls**: Use "Enable All Debug" or "Disable All Debug" for convenience

## Performance Considerations

* Debug gizmos are completely removed when debug mode is disabled
* Materials are reused across similar gizmo types
* Geometry cleanup prevents memory leaks
* Debug system only processes entities when enabled
* Gizmos are recreated each frame for real-time updates

## Color Legend

* 🔴 **Red Spheres**: Shooting Points
* 🟢 **Green Wireframe Shapes**: Collision Shapes (Boxes for ships, Spheres for bullets)
* 🔵 **Blue Rings**: Weapon Firing Range
* 🟠 **Orange Rings**: Auto-Targeting Detection Range
* 🟡 **Yellow Lines**: Velocity Vectors
* 🔴 **Red Wireframe Boxes**: Restricted Zones
* 🟢 **Green Wireframe Boxes**: Spawn Zones

## Technical Notes

* Debug system runs after camera system but before render system
* All debug meshes use transparent materials with appropriate opacity
* Shooting points account for ship rotation and relative positioning
* Collision shapes match the actual collision system (configurable boxes and spheres)
* Velocity vectors are scaled by 2.0x for better visibility
* Debug entity is persistent throughout the game session

## Future Enhancements

Potential additions to the debug system:
* Health bars visualization
* AI state indicators
* Projectile trajectory prediction
* Performance metrics overlay
* Entity ID labels
* Input state visualization
