# Enemy AI Obstacle Avoidance

## Overview

The EnemyAISystem has been enhanced with intelligent obstacle avoidance using ray casting. Enemy ships will now navigate around islands (restricted zones) while pursuing the player.

## Features

### Ray Casting System

* Casts rays from enemy position toward the player
* Detects obstacles (restricted zones) along the path
* Uses configurable step-based detection for accuracy

### Alternative Path Finding

* If direct path is blocked, tries alternative angles
* Tests angles to the right and left of the direct path
* Configurable angle increments and maximum attempts
* Falls back to direct movement if no clear path found

### Smart Fallback

* Uses existing RestrictedZoneSystem for collision response
* Ensures ships don't get completely stuck
* Maintains pursuit behavior even when obstacles are present

## Configuration

The obstacle avoidance behavior is configurable through `src/config/EnemyAIConfig.ts` :

```typescript
export const enemyAIConfig: EnemyAIConfig = {
    rayCasting: {
        maxRayDistance: 50,        // Maximum distance to check for obstacles
        rayStep: 0.5,              // Check every 0.5 units along the ray
        angleStep: Math.PI / 8,    // 22.5 degrees between ray attempts
        maxAngleAttempts: 16,      // Try up to 16 different angles
    },
}
```

### Configuration Parameters

* **maxRayDistance**: Maximum length of ray casts (default: 50 units)
* **rayStep**: Distance between ray check points (default: 0.5 units)
* **angleStep**: Angle increment between alternative paths (default: 22.5°)
* **maxAngleAttempts**: Maximum number of alternative angles to try (default: 16)

## Algorithm

1. **Direct Path Check**: Cast ray directly toward player
2. **Alternative Paths**: If blocked, try angles to the right and left
3. **Path Selection**: Use first clear path found
4. **Fallback**: If no clear path, use direct path (collision handled by RestrictedZoneSystem)

## Integration

The system integrates with existing components:
* **InputSystem**: Receives calculated safe direction
* **AccelerationSystem**: Applies movement based on safe direction
* **RestrictedZoneSystem**: Provides collision detection as backup
* **MovementSystem**: Handles actual position updates

## Performance

* Ray casting is performed every frame for each enemy
* Configurable parameters allow tuning for performance vs accuracy
* Step-based detection provides good balance of speed and precision

## Testing

The system has been tested with:
* ✅ Zone detection accuracy
* ✅ Direct path blocking detection
* ✅ Alternative path finding
* ✅ Fallback behavior
* ✅ Integration with existing systems
