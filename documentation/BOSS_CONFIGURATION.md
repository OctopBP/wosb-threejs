# Boss Configuration Guide

This document explains how to configure the boss enemy in the game. All boss settings are centralized and easily modifiable.

## Configuration File

The boss configuration is located in `src/config/BossConfig.ts`.

## Boss Properties

### Health Configuration
```typescript
export const basicBossHealthPreset: BossHealthConfig = {
    maxHealth: 1000, // Boss health points
}
```

### Weapon Configuration
```typescript
export const bossWeaponPreset: WeaponConfigPreset = {
    damage: 100,              // Damage per shot (current: kills player in 1 hit)
    fireRate: 0.5,            // Shots per second (slower = more balanced)
    projectileSpeed: 8.0,     // Speed of boss projectiles
    range: 15.0,              // Maximum shooting range
    detectionRange: 18.0,     // How far boss can detect player
    isAutoTargeting: true,    // Boss automatically aims at player
}
```

### Movement Configuration  
```typescript
export const bossMovementPreset: MovementConfigPreset = {
    maxSpeed: 3.0,            // Maximum movement speed
    accelerationForce: 2.5,   // How quickly boss accelerates
    boundaries: {             // Movement boundaries
        minX: -20, maxX: 20,
        minY: 0, maxY: 5,
        minZ: -20, maxZ: 20,
    },
}
```

### AI Configuration
```typescript
export const basicBossAIPreset: BossAIConfig = {
    moveSpeed: 2.0,           // AI movement speed
    shootingRange: 15.0,      // Range at which boss starts shooting
}
```

### Visual Configuration
```typescript
export const basicBossVisualPreset: BossVisualConfig = {
    scale: 2.5,               // Visual scale multiplier (2.5x bigger than enemies)
    meshType: 'enemy1',       // 3D model to use (can be changed to 'boss')
}
```

## XP Reward Configuration

Boss XP reward is configured in `src/systems/GameStateSystem.ts`:

```typescript
const xpAwarded = isBoss ? enemyXPConfig.basicEnemy * 20 : enemyXPConfig.basicEnemy
```

Currently the boss gives **20x** the XP of a regular enemy.

## Easy Modifications

### Making Boss Easier
- Reduce `damage` (e.g., to 50 for 2-hit kill)
- Reduce `maxHealth` (e.g., to 500)  
- Increase `fireRate` (faster but less dangerous)
- Reduce `projectileSpeed` (easier to dodge)

### Making Boss Harder
- Increase `damage` (current 100 already kills in 1 hit)
- Increase `maxHealth` (e.g., to 2000)
- Reduce `fireRate` (fewer but more dangerous shots)
- Increase `moveSpeed` and `maxSpeed`

### Visual Changes
- Change `scale` for size (1.0 = normal, 3.0 = very large)
- Change `meshType` to use different 3D model
- Modify fallback color in RenderSystem (currently red for boss)

### XP Balance
- Modify the multiplier in GameStateSystem (currently 20x)
- Consider boss health/damage ratio when setting XP

## Example: Balanced Boss
```typescript
// In BossConfig.ts
export const basicBossHealthPreset: BossHealthConfig = {
    maxHealth: 300, // Moderate health
}

export const bossWeaponPreset: WeaponConfigPreset = {
    damage: 34,     // 3-hit kill (if player has 100 HP)
    fireRate: 0.6,  // Slightly faster
    // ... other settings
}

// In GameStateSystem.ts  
const xpAwarded = isBoss ? enemyXPConfig.basicEnemy * 10 : enemyXPConfig.basicEnemy
```

## Current Boss Stats Summary

- **Health**: 1000 HP (20x regular enemy)
- **Damage**: 100 per shot (1-hit kill)
- **Size**: 2.5x larger than regular enemies  
- **XP Reward**: 20x regular enemy XP
- **Speed**: Slower than regular enemies for balance
- **Range**: Longer detection and shooting range

The boss is designed to be a significant challenge that requires either superior player skill or multiple attempts, driving the "new ship offer" conversion mechanic.