# Model Collider System Usage Guide

The model collider system allows you to use actual 3D model geometry for collision detection instead of simple primitive shapes like boxes and spheres. This provides more accurate collision detection while maintaining good performance through intelligent caching.

## Features

- **Three precision levels**: `boundingBox`, `boundingSphere`, and `geometry`
- **Model caching**: Collision data is computed once per model+scale combination
- **Debug visualization**: Wireframe overlays show collision boundaries in debug mode
- **Performance optimized**: Uses Three.js built-in collision utilities

## Quick Start

### 1. Basic Model Collider

```typescript
import { createModelCollision } from '../config/CollisionConfig'

// Create a bounding box collider for a ship model
const collision = createModelCollision('ship_lvl_1', 'boundingBox', 1.5)
entity.addComponent(collision)
```

### 2. Using Presets

```typescript
import { modelCollisionPresets } from '../config/CollisionConfig'

// Use a preset model collider
const collision: CollisionComponent = {
    type: 'collision',
    collider: modelCollisionPresets.barrelModel,
    offset: { x: 0, y: 0.5, z: 0 }
}
entity.addComponent(collision)
```

### 3. High-Precision Collision

```typescript
// For complex shapes where accuracy is critical
const collision = createModelCollision('island', 'geometry', 1.0)
entity.addComponent(collision)
```

## Precision Levels

### `boundingBox` (Recommended)
- **Performance**: Fastest
- **Use case**: Most objects, especially rectangular or box-like shapes
- **Accuracy**: Good for most gameplay scenarios
- **Example**: Ships, buildings, containers

### `boundingSphere` 
- **Performance**: Fast
- **Use case**: Round or spherical objects
- **Accuracy**: Good for circular objects
- **Example**: Barrels, spheres, planets

### `geometry`
- **Performance**: Slower
- **Use case**: Complex shapes where precision is critical
- **Accuracy**: Highest, uses actual mesh geometry
- **Example**: Islands, complex terrain, irregular obstacles

## Available Model Types

The system supports all model types defined in `ModelConfig.ts`:

- `ship_lvl_1`, `ship_lvl_2`, `ship_lvl_3` - Player ships
- `enemy1` - Enemy ship
- `boss` - Boss ship
- `island` - Environment obstacles
- `barrel` - Collectible items

## Integration with Existing Systems

### Entity Factory Example

```typescript
// In PlayerFactory.ts
import { createModelCollision } from '../config/CollisionConfig'

export function createPlayerShipWithModelCollider(): Entity {
    const entity = new Entity()
    
    // ... other components ...
    
    // Replace simple box collider with model-based collider
    const collision = createModelCollision(
        'ship_lvl_1', 
        'boundingBox', 
        1.5,
        { x: 0, y: 0.5, z: 0 } // Optional offset
    )
    entity.addComponent(collision)
    
    return entity
}
```

### Debug Visualization

The model colliders automatically work with the debug system. Enable debug mode to see wireframe visualizations:

```typescript
// In GameWorld.ts or wherever you set up debug mode
const debugEntity = createDebugEntity()
world.addEntity(debugEntity)
```

## Performance Considerations

1. **Caching**: Collision data is cached per `modelType + scale` combination
2. **Memory**: Each unique model+scale uses memory for collision data
3. **Computation**: Initial collision data computation happens once per cache entry
4. **Runtime**: `boundingBox` and `boundingSphere` are very fast, `geometry` is slower

### Performance Tips

```typescript
// Good: Reuse same scale for similar entities
const scale = 1.5
const collision1 = createModelCollision('ship_lvl_1', 'boundingBox', scale)
const collision2 = createModelCollision('ship_lvl_1', 'boundingBox', scale) // Uses cache

// Avoid: Different scales create separate cache entries
const collision3 = createModelCollision('ship_lvl_1', 'boundingBox', 1.6) // New cache entry
```

## Cache Management

```typescript
// Access collision system to manage cache
const collisionSystem = world.getSystem(CollisionSystem)

// Clear cache if needed (e.g., when changing levels)
collisionSystem.clearModelCollisionCache()
```

## Migration from Simple Colliders

### Before (Box Collider)
```typescript
const collision = createPlayerShipCollision({ x: 0, y: 0.5, z: 0 })
entity.addComponent(collision)
```

### After (Model Collider)
```typescript
const collision = createModelCollision(
    'ship_lvl_1', 
    'boundingBox', 
    1.5, 
    { x: 0, y: 0.5, z: 0 }
)
entity.addComponent(collision)
```

## Troubleshooting

### Model Not Found
```
Warning: Collision model 'unknown_model' not found in cache
```
**Solution**: Ensure the model type exists in `ModelConfig.ts` and models are preloaded

### Performance Issues
**Symptoms**: Frame rate drops during collision detection
**Solutions**:
- Use `boundingBox` instead of `geometry` precision
- Reduce number of entities with `geometry` precision
- Clear collision cache periodically

### Debug Visualization Issues
**Problem**: Collision shapes not visible in debug mode
**Solution**: Ensure debug entity is added to world and debug system is active

## Best Practices

1. **Start with `boundingBox`**: Most accurate for the majority of objects
2. **Use presets**: Leverage `modelCollisionPresets` for common configurations
3. **Profile performance**: Monitor frame rates when adding model colliders
4. **Cache awareness**: Reuse scale values when possible
5. **Debug early**: Use wireframe visualization during development

## Advanced Usage

### Custom Collision Presets

```typescript
// Add to CollisionConfig.ts
export const myCustomCollisionPresets = {
    customShip: {
        shape: 'model' as const,
        modelType: 'ship_lvl_3' as ModelType,
        precision: 'boundingSphere' as const,
        scale: 2.0,
    } satisfies ModelCollider,
}
```

### Runtime Precision Switching

```typescript
// Change precision based on game state
const lowDetail = createModelCollision('boss', 'boundingBox', 0.5)
const highDetail = createModelCollision('boss', 'geometry', 0.5)

// Use lowDetail for distant objects, highDetail for nearby
const collision = distanceToPlayer > 50 ? lowDetail : highDetail
entity.addComponent(collision)
```

## API Reference

### Functions

- `createModelCollision(modelType, precision?, scale?, offset?)`: Create model collision component
- `modelCollisionPresets`: Predefined model collider configurations
- `clearModelCollisionCache()`: Clear collision data cache

### Types

- `ModelCollider`: Collision shape definition
- `ModelType`: Available 3D model identifiers
- `precision`: `'boundingBox' | 'boundingSphere' | 'geometry'`