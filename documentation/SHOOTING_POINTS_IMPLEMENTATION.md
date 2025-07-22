# Shooting Points Implementation

## Overview
This implementation adds multiple shooting points to ships, allowing cannons to be positioned at specific locations relative to the ship. When shooting, the system automatically chooses the closest shooting point to the target for optimal firing position.

## Features Added

### 1. WeaponComponent Enhancement
- Added `shootingPoints: Array<{ x: number; y: number }>` property to the WeaponComponent interface
- Each shooting point represents a relative position where a cannon is located on the ship

### 2. Configuration Updates
All weapon presets now include predefined shooting points:

#### Player Ship Configurations:
- **Basic Cannon Preset**: 4 shooting points (side cannons)
  ```typescript
  shootingPoints: [
      { x: -1, y: 1 },  // Left front cannon
      { x: -1, y: 0 },  // Left center cannon  
      { x: 1, y: 1 },   // Right front cannon
      { x: 1, y: 0 }    // Right center cannon
  ]
  ```

- **Auto-targeting Cannon**: 2 shooting points (balanced setup)
  ```typescript
  shootingPoints: [
      { x: -0.8, y: 0.5 },  // Left cannon
      { x: 0.8, y: 0.5 }    // Right cannon
  ]
  ```

- **Fast Auto-targeting**: 4 shooting points (rapid fire setup)
  ```typescript
  shootingPoints: [
      { x: -0.5, y: 1 },   // Left front
      { x: 0.5, y: 1 },    // Right front
      { x: -0.5, y: -0.5 }, // Left rear
      { x: 0.5, y: -0.5 }  // Right rear
  ]
  ```

#### Enemy Ship Configurations:
- **Auto-targeting Enemy**: 2 front-facing cannons
- **Fast Enemy**: 3 cannons (left, right, center)  
- **Weak Enemy**: Single front cannon

#### Boss Configuration:
- **Boss Ship**: 5 powerful cannons for devastating firepower
  ```typescript
  shootingPoints: [
      { x: -1.5, y: 1.2 },  // Left outer cannon
      { x: -0.8, y: 1.0 },  // Left inner cannon
      { x: 0.8, y: 1.0 },   // Right inner cannon
      { x: 1.5, y: 1.2 },   // Right outer cannon
      { x: 0, y: 0.5 }      // Center main cannon
  ]
  ```

### 3. WeaponSystem Enhancements
Added new methods to handle shooting point logic:

#### `findClosestShootingPoint()`
- Analyzes all shooting points relative to the target position
- Converts relative positions to world coordinates using ship rotation
- Returns the shooting point closest to the target

#### `getWorldShootingPosition()`
- Converts relative shooting point coordinates to world coordinates
- Applies proper rotation transformation based on ship orientation
- Accounts for ship rotation when calculating cannon positions

#### Updated Firing Methods:
- **`fireProjectile()`**: Uses first shooting point for manual aiming
- **`fireProjectileToTarget()`**: Uses closest shooting point to target for auto-targeting

## Technical Implementation

### Coordinate System
- Shooting points use relative coordinates (x, y) where:
  - `x`: Left/Right offset from ship center
  - `y`: Forward/Backward offset from ship center
  - Positive Y is forward, negative Y is backward
  - Positive X is right, negative X is left

### Rotation Transformation
The system applies proper 2D rotation transformation:
```typescript
worldX = shipX + (pointX * cos(rotation) - pointY * sin(rotation))
worldZ = shipZ + (pointX * sin(rotation) + pointY * cos(rotation))
```

### Fallback Behavior
- If no shooting points are defined, the system defaults to the ship center (0, 0)
- Ensures backward compatibility with existing configurations

## Benefits

1. **Realistic Cannon Placement**: Ships can have cannons positioned where they would logically be located
2. **Tactical Advantage**: Closest shooting point selection improves accuracy and reduces unnecessary ship rotation
3. **Visual Diversity**: Different ship types can have unique cannon configurations
4. **Scalability**: Easy to add new ships with custom shooting point layouts
5. **Performance**: Efficient closest-point algorithm minimizes computational overhead

## Usage Examples

### Creating a Custom Ship Configuration:
```typescript
const customWeaponPreset: WeaponConfigPreset = {
    damage: 30,
    fireRate: 1.0,
    projectileSpeed: 12.0,
    range: 18.0,
    projectileType: 'bullet',
    isAutoTargeting: true,
    detectionRange: 20.0,
    requiresLineOfSight: false,
    shootingPoints: [
        { x: -2, y: 1.5 },  // Left wing cannon
        { x: 2, y: 1.5 },   // Right wing cannon  
        { x: 0, y: 0.8 }    // Nose cannon
    ]
}
```

### Modifying Existing Ships:
```typescript
updateWeaponConfig(playerShip, {
    shootingPoints: [
        { x: -1.2, y: 0.8 }, // Custom left cannon
        { x: 1.2, y: 0.8 }   // Custom right cannon
    ]
})
```

## Future Enhancements

1. **Multi-gun Salvos**: Fire from multiple points simultaneously
2. **Rotating Turrets**: Dynamic shooting point rotation independent of ship
3. **Weapon-specific Points**: Different weapons on the same ship with unique shooting points
4. **Visual Indicators**: Show cannon positions in the game UI
5. **Damage Model**: Individual cannon damage/destruction mechanics