# Enemy AI Player Avoidance System

## Overview

The enemy AI system has been enhanced to include player collision avoidance using the same logic as obstacle avoidance. This prevents enemies from colliding with the player ship while still allowing them to approach and engage in combat.

## How It Works

### Distance-Based Avoidance

Enemies will only apply player avoidance when they are within a configured minimum distance from the player. This prevents unnecessary pathfinding overhead when enemies are far away.

### Ray Casting with Player Detection

The system uses the same ray casting mechanism as obstacle avoidance, but also checks if the projected path would collide with the player's collision bounds.

### Configurable Avoidance Strength

The system includes a configurable avoidance strength parameter that allows for fine-tuning of how strongly enemies avoid the player.

## Configuration

### EnemyAIConfig.ts

```typescript
export const enemyAIConfig: EnemyAIConfig = {
    rayCasting: {
        maxRayDistance: 50, // Maximum distance to check for obstacles
        rayStep: 0.5, // Check every 0.5 units along the ray
        angleStep: Math.PI / 8, // 22.5 degrees between ray attempts
        maxAngleAttempts: 16, // Try up to 16 different angles
    },
    playerAvoidance: {
        minDistance: 3.0, // Minimum distance to maintain from player
        avoidanceStrength: 1.0, // How strongly to avoid the player (0-1)
    },
}
```

### Parameters

* **minDistance**: The distance at which enemies start avoiding the player. Enemies beyond this distance will use simple obstacle avoidance.
* **avoidanceStrength**: Controls how strongly enemies avoid the player (0.0 = no avoidance, 1.0 = full avoidance).

## Implementation Details

### Collision Detection

The system uses the same collision detection logic as the CollisionSystem:

* **Sphere Collision**: For spherical player collision bounds
* **Box Collision**: For box-shaped player collision bounds
* **Offset Support**: Respects collision component offsets

### Path Finding Algorithm

1. **Distance Check**: Only applies player avoidance when within `minDistance`
2. **Direct Path**: First tries the direct path to the player
3. **Alternative Angles**: If direct path is blocked, tries angles to the left and right
4. **Fallback**: If no clear path is found, returns direct direction (handled by RestrictedZoneSystem)

### Performance Considerations

* Player avoidance is only calculated when enemies are within the minimum distance
* Uses the same ray casting parameters as obstacle avoidance
* Collision checks are optimized to use the same logic as the main collision system

## Usage Examples

### Basic Configuration

```typescript
// Enemies will start avoiding the player when within 3 units
minDistance: 3.0

// Enemies will completely avoid the player
avoidanceStrength: 1.0
```

### Aggressive Enemies

```typescript
// Enemies will get very close before avoiding
minDistance: 1.5

// Enemies will sometimes still approach the player
avoidanceStrength: 0.7
```

### Passive Enemies

```typescript
// Enemies will start avoiding from far away
minDistance: 5.0

// Enemies will always avoid the player
avoidanceStrength: 1.0
```

## Integration with Existing Systems

The player avoidance system integrates seamlessly with:

* **RestrictedZoneSystem**: Handles collision response when no clear path is found
* **CollisionSystem**: Uses the same collision detection logic
* **MovementSystem**: Enemies move according to the calculated safe direction
* **WeaponSystem**: Shooting behavior is unaffected by movement avoidance

## Troubleshooting

### Enemies Still Colliding with Player

1. Check that `minDistance` is appropriate for your game scale
2. Verify that player collision component is properly configured
3. Ensure `avoidanceStrength` is not set to 0

### Enemies Avoiding Player Too Much

1. Reduce `avoidanceStrength` to allow more direct approaches
2. Increase `minDistance` to reduce the avoidance zone
3. Adjust ray casting parameters for more pathfinding attempts

### Performance Issues

1. Increase `rayStep` to reduce collision checks
2. Decrease `maxAngleAttempts` to reduce pathfinding complexity
3. Increase `minDistance` to reduce the number of enemies using avoidance
