# Shooting Points Rotation Test

## Verification that Shooting Points Rotate with Ship

The shooting points implementation correctly applies 2D rotation transformation to ensure that cannon positions rotate with the ship.

### Rotation Transformation Formula (Corrected)
```typescript
// Use negative rotation to fix direction
const rotation = -shooterPosition.rotationY
worldX = shipX + (pointX * cos(rotation) - pointY * sin(rotation))
worldZ = shipZ + (pointX * sin(rotation) + pointY * cos(rotation))
```

### Test Cases (Corrected Rotation Direction)

#### Test 1: Ship Facing North (rotation = 0)
- **Ship Position**: (0, 0)
- **Ship Rotation**: 0 radians (facing north)
- **Shooting Point**: { x: 1, y: 1 } (right-front cannon)

**Expected World Position**:
- rotation = -0 = 0
- worldX = 0 + (1 * cos(0) - 1 * sin(0)) = 0 + (1 * 1 - 1 * 0) = 1
- worldZ = 0 + (1 * sin(0) + 1 * cos(0)) = 0 + (1 * 0 + 1 * 1) = 1
- **Result**: (1, 1) ✅ Right-front of ship

#### Test 2: Ship Facing East (rotation = π/2)
- **Ship Position**: (0, 0) 
- **Ship Rotation**: π/2 radians (90° clockwise, facing east)
- **Shooting Point**: { x: 1, y: 1 } (same cannon)

**Expected World Position**:
- rotation = -π/2
- worldX = 0 + (1 * cos(-π/2) - 1 * sin(-π/2)) = 0 + (1 * 0 - 1 * -1) = 1
- worldZ = 0 + (1 * sin(-π/2) + 1 * cos(-π/2)) = 0 + (1 * -1 + 1 * 0) = -1
- **Result**: (1, -1) ✅ Cannon correctly rotated - now at right-rear relative to world

#### Test 3: Ship Facing South (rotation = π)
- **Ship Position**: (0, 0)
- **Ship Rotation**: π radians (180°, facing south)
- **Shooting Point**: { x: 1, y: 1 } (same cannon)

**Expected World Position**:
- rotation = -π
- worldX = 0 + (1 * cos(-π) - 1 * sin(-π)) = 0 + (1 * -1 - 1 * 0) = -1
- worldZ = 0 + (1 * sin(-π) + 1 * cos(-π)) = 0 + (1 * 0 + 1 * -1) = -1
- **Result**: (-1, -1) ✅ Cannon rotated 180° - now at left-rear relative to world

#### Test 4: Ship Facing West (rotation = 3π/2)
- **Ship Position**: (0, 0)
- **Ship Rotation**: 3π/2 radians (270°, facing west)
- **Shooting Point**: { x: 1, y: 1 } (same cannon)

**Expected World Position**:
- rotation = -3π/2
- worldX = 0 + (1 * cos(-3π/2) - 1 * sin(-3π/2)) = 0 + (1 * 0 - 1 * 1) = -1
- worldZ = 0 + (1 * sin(-3π/2) + 1 * cos(-3π/2)) = 0 + (1 * 1 + 1 * 0) = 1
- **Result**: (-1, 1) ✅ Cannon rotated 270° - now at left-front relative to world

### Fix Applied

**Problem**: The shooting points were rotating in the opposite direction to the ship's rotation.

**Solution**: Negate the rotation angle in the transformation:
```typescript
const rotation = -shooterPosition.rotationY
```

This ensures that when the ship rotates clockwise, the shooting points also rotate clockwise relative to the ship's local coordinate system.

### Implementation Verification

The rotation is applied in two key methods:

1. **`findClosestShootingPoint()`**: 
   - Uses corrected rotation to transform each shooting point to world coordinates
   - Calculates distance from correctly rotated position to target
   - Selects closest cannon that rotates properly with ship

2. **`getWorldShootingPosition()`**:
   - Uses corrected rotation to convert the selected shooting point to world coordinates
   - Ensures projectile fires from the correctly rotated cannon position

### Visual Confirmation

When the ship rotates:
- ✅ Shooting points now rotate in the SAME direction as the ship
- ✅ Right cannons stay on the right side of the ship
- ✅ Left cannons stay on the left side of the ship  
- ✅ Front cannons stay in front, rear cannons stay in rear
- ✅ Projectiles spawn from visually correct cannon positions

The shooting points now **correctly rotate with the ship** in the proper direction.