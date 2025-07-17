# Game Restart Fix

## Problem
When the game restarted (after player death and clicking "Get it" button), ship models from the previous play session were remaining in the scene, causing visual artifacts and potential memory leaks.

## Root Cause
The original `restartGame()` method in `GameStateSystem` was only removing entities with the 'enemy' component, but leaving behind:
- Player entities with stale state
- Projectiles still flying in the scene
- Three.js meshes not properly disposed
- Boss entities (though they had both 'boss' and 'enemy' components)

## Solution Implemented

### 1. Enhanced GameStateSystem.restartGame()
- **Complete Entity Cleanup**: Now removes ALL entities except the game state entity itself
- **Proper Mesh Disposal**: Disposes Three.js geometry and materials to prevent memory leaks
- **Scene Cleanup**: Removes meshes from the Three.js scene properly

### 2. Added GameWorld.restartPlayer()
- **Fresh Player Creation**: Creates a completely new player entity instead of reusing the old one
- **Camera Reset**: Properly reconnects the camera target to the new player entity
- **Clean State**: Ensures the player starts with fresh, default stats and components

### 3. System Integration
- **GameStateSystem ↔ GameWorld Connection**: Added `setGameWorld()` method to allow GameStateSystem to trigger player recreation
- **Simplified NewShipOfferUISystem**: Removed manual health reset since complete recreation handles this automatically

## Technical Details

### Before (Problematic)
```typescript
// Only removed enemies, leaving projectiles and stale player
const enemies = this.world.getEntitiesWithComponents(['enemy'])
for (const enemy of enemies) {
    this.world.removeEntity(enemy.id)
}
```

### After (Fixed)
```typescript
// Remove ALL entities except game state with proper cleanup
const allEntities = Array.from(this.world.getAllEntities())
for (const entity of allEntities) {
    if (entity === this.gameStateEntity) continue
    
    // Dispose Three.js meshes properly
    const renderable = entity.getComponent<RenderableComponent>('renderable')
    if (renderable?.mesh) {
        // Remove from scene and dispose geometry/materials
        if (renderable.mesh.parent) {
            renderable.mesh.parent.remove(renderable.mesh)
        }
        // ... dispose geometry and materials
    }
    
    this.world.removeEntity(entity.id)
}

// Recreate fresh player
if (this.gameWorld) {
    this.gameWorld.restartPlayer()
}
```

## Benefits

1. **No Visual Artifacts**: Old ship models no longer persist after restart
2. **Memory Efficiency**: Proper disposal prevents memory leaks from accumulating meshes
3. **Clean State**: Player starts each game with completely fresh state
4. **Performance**: No leftover entities consuming update cycles
5. **Maintainable**: Clear separation of concerns between cleanup and recreation

## Testing

To test the fix:
1. Play the game until player death
2. Click "Get it" button to restart
3. Verify no old ship models remain visible
4. Confirm game starts fresh with only new entities

The fix ensures a clean slate for each game restart, eliminating the accumulation of old entities and meshes.