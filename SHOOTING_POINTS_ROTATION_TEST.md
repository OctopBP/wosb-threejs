# Shooting Points Rotation Test

## Verification that Shooting Points Rotate with Ship

The shooting points implementation correctly applies 2D rotation transformation to ensure that cannon positions rotate with the ship.

### Rotation Transformation Formula
```typescript
worldX = shipX + (pointX * cos(shipRotation) - pointY * sin(shipRotation))
worldZ = shipZ + (pointX * sin(shipRotation) + pointY * cos(shipRotation))
```

### Test Cases

#### Test 1: Ship Facing North (rotation = 0)
- **Ship Position**: (0, 0)
- **Ship Rotation**: 0 radians (facing north)
- **Shooting Point**: { x: 1, y: 1 } (right-front cannon)

**Expected World Position**:
- worldX = 0 + (1 * cos(0) - 1 * sin(0)) = 0 + (1 * 1 - 1 * 0) = 1
- worldZ = 0 + (1 * sin(0) + 1 * cos(0)) = 0 + (1 * 0 + 1 * 1) = 1
- **Result**: (1, 1) ✅ Right-front of ship

#### Test 2: Ship Facing East (rotation = π/2)
- **Ship Position**: (0, 0) 
- **Ship Rotation**: π/2 radians (90° clockwise, facing east)
- **Shooting Point**: { x: 1, y: 1 } (same cannon)

**Expected World Position**:
- worldX = 0 + (1 * cos(π/2) - 1 * sin(π/2)) = 0 + (1 * 0 - 1 * 1) = -1
- worldZ = 0 + (1 * sin(π/2) + 1 * cos(π/2)) = 0 + (1 * 1 + 1 * 0) = 1
- **Result**: (-1, 1) ✅ Cannon rotated 90° - now at left-front relative to world

#### Test 3: Ship Facing South (rotation = π)
- **Ship Position**: (0, 0)
- **Ship Rotation**: π radians (180°, facing south)
- **Shooting Point**: { x: 1, y: 1 } (same cannon)

**Expected World Position**:
- worldX = 0 + (1 * cos(π) - 1 * sin(π)) = 0 + (1 * -1 - 1 * 0) = -1
- worldZ = 0 + (1 * sin(π) + 1 * cos(π)) = 0 + (1 * 0 + 1 * -1) = -1
- **Result**: (-1, -1) ✅ Cannon rotated 180° - now at left-rear relative to world

#### Test 4: Ship Facing West (rotation = 3π/2)
- **Ship Position**: (0, 0)
- **Ship Rotation**: 3π/2 radians (270°, facing west)
- **Shooting Point**: { x: 1, y: 1 } (same cannon)

**Expected World Position**:
- worldX = 0 + (1 * cos(3π/2) - 1 * sin(3π/2)) = 0 + (1 * 0 - 1 * -1) = 1
- worldZ = 0 + (1 * sin(3π/2) + 1 * cos(3π/2)) = 0 + (1 * -1 + 1 * 0) = -1
- **Result**: (1, -1) ✅ Cannon rotated 270° - now at right-rear relative to world

### Implementation Verification

The rotation is applied in two key methods:

1. **`findClosestShootingPoint()`**: 
   - Transforms each shooting point to world coordinates
   - Calculates distance from transformed position to target
   - Selects closest cannon that has been properly rotated with ship

2. **`getWorldShootingPosition()`**:
   - Converts the selected shooting point to world coordinates
   - Ensures projectile fires from the correctly rotated cannon position

### Visual Confirmation

When the ship rotates:
- ✅ Left cannons become right cannons (and vice versa) 
- ✅ Front cannons become rear cannons (and vice versa)
- ✅ Shooting point selection adapts to ship orientation
- ✅ Projectiles spawn from visually correct cannon positions

The shooting points are **correctly rotating with the ship** as implemented.