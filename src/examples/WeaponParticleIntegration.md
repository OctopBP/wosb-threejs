# Weapon System Particle Integration

This document explains how the WeaponSystem is integrated with the ParticleSystem to create visual effects when weapons fire.

## Overview

The WeaponSystem now automatically creates particle effects when weapons fire, including:
- **Gunsmoke**: Realistic smoke particles that appear at the muzzle
- **Muzzle Flash**: Bright, short-lived flash particles for visual impact

## Key Features

### ✅ **Individual Particle Systems Per Shot**
- Each weapon shot creates its own unique particle systems
- Multiple weapons can fire simultaneously without interference
- Each cannon/shooting point gets its own particle effects

### ✅ **Automatic Cleanup**
- Particle systems are automatically removed after particles expire
- No memory leaks or accumulation of unused systems
- Efficient resource management

### ✅ **Multi-Cannon Support**
- Ships with multiple shooting points get separate effects per cannon
- Shooting point index is included in particle system IDs
- Supports rapid-fire weapons with randomized IDs

## Configuration

### Particle Configurations
All particle configurations are defined in `/src/config/ParticlesConfig.ts`:

```typescript
// Gunsmoke particles - realistic smoke effect
export const gunsmokeParticleConfig: ParticleSystemConfig = {
    id: 'gunsmoke',
    emissionRate: 0,           // No continuous emission
    burstCount: 8,             // 8 particles per shot
    burstInterval: -1,         // No automatic bursts
    life: { min: 0.8, max: 1.5 },
    size: { min: 1.5, max: 3.0 },
    speed: { min: 2.0, max: 6.0 },
    spawnArea: {
        type: 'box',
        size: new Vector3(0.3, 0.2, 0.3)  // Small area around muzzle
    },
    direction: new Vector3(0, 0, 1),      // Forward direction
    directionSpread: Math.PI * 0.25,      // 45 degree spread
    gravity: new Vector3(0, -2.0, 0),     // Light downward pull
    drag: 1.2,                            // Quick dissipation
    startColor: new Color(0xdddddd),      // Light gray
    endColor: new Color(0x333333),        // Dark gray
    texture: 'assets/sprites/gunsmoke.png'
}
```

### Integration Setup
The integration is automatically set up in `GameWorld.ts`:

```typescript
// Create systems
this.weaponSystem = new WeaponSystem(this.world, scene)
this.particleSystem = new ParticleSystem(this.world, scene, camera)

// Connect systems
this.weaponSystem.setParticleSystem(this.particleSystem)
```

### Unique Particle System IDs
Each shot creates particle systems with unique IDs following this pattern:
```typescript
// Format: {effect}_{shooterId}_{shootingPointIndex}_{timestamp}_{randomSuffix}
const gunsmokeId = `gunsmoke_${shooterId}_${shootingPointIndex}_${timestamp}_${randomSuffix}`
const muzzleFlashId = `muzzleflash_${shooterId}_${shootingPointIndex}_${timestamp}_${randomSuffix}`

// Examples:
// gunsmoke_42_0_1703123456789_234
// muzzleflash_42_1_1703123456790_567
// gunsmoke_58_0_1703123456791_891
```

## How It Works

### 1. System Initialization
When `setParticleSystem()` is called on WeaponSystem:
- Stores reference to ParticleSystem
- No pre-created particle systems (they are created per shot)

### 2. Weapon Firing
When a weapon fires (either manual or auto-targeting):
- Identifies the specific shooter and shooting point
- Calculates the world position of the shooting point
- Calculates the shooting direction
- Creates unique particle systems for this specific shot
- Triggers particle bursts immediately
- Schedules automatic cleanup

### 3. Particle Effects Flow
```typescript
// In WeaponSystem.fireProjectile() or fireProjectileToTarget()
this.playWeaponParticleEffects(shooterId, shootingPointIndex, worldShootingPos, { x: forwardX, z: forwardZ })

// Which creates unique particle systems:
const gunsmokeConfig = getParticleConfig('gunsmoke', shootingPosition, shootingDirection)
gunsmokeConfig.id = `gunsmoke_${shooterId}_${shootingPointIndex}_${timestamp}_${randomSuffix}`
this.particleSystem.createParticleSystem(gunsmokeConfig)
this.particleSystem.burst(gunsmokeConfig.id)

// And schedules cleanup:
setTimeout(() => {
    this.particleSystem?.removeParticleSystem(gunsmokeConfig.id)
}, 2000)
```

## Particle Types

### Gunsmoke Particles
- **Purpose**: Realistic smoke effect from weapon discharge
- **Behavior**: Expands and rises slightly, fades over time
- **Duration**: 0.8-1.5 seconds
- **Count per shot**: 8 particles
- **Visual**: Gray smoke that darkens as it dissipates

### Muzzle Flash Particles  
- **Purpose**: Bright flash effect at weapon muzzle
- **Behavior**: Quick, bright burst with tight spread
- **Duration**: 0.05-0.15 seconds (very short)
- **Count per shot**: 3 particles
- **Visual**: Bright white to orange flash

## Customization

### Adding New Weapon Particle Effects
1. Define new particle config in `ParticlesConfig.ts`
2. Add the config to `particleConfigs` object
3. Update `WeaponSystem.setParticleSystem()` to create the new system
4. Update `WeaponSystem.playWeaponParticleEffects()` to trigger the new effect

### Modifying Existing Effects
Edit the configurations in `ParticlesConfig.ts`:
- Change `burstCount` for more/fewer particles per shot
- Adjust `life` values for longer/shorter lasting effects
- Modify `speed` and `directionSpread` for different behaviors
- Update colors for different visual styles

## Performance Considerations

- **Individual systems per shot**: Each shot creates its own particle systems for maximum flexibility
- **Automatic cleanup**: Systems are automatically removed after particle lifetimes expire
- **Only burst emission**: No continuous emission, particles only created on weapon fire
- **Efficient material grouping**: Multiple textures/sprite sheets render efficiently together
- **Unique ID generation**: Fast timestamp + random suffix ensures no conflicts
- **Memory management**: No accumulation of unused particle systems

## Advanced Multi-Weapon Scenarios

### Rapid Fire Weapons
The system handles rapid fire by using both timestamp and random suffix:
```typescript
// Even if two shots fire in the same millisecond, they get unique IDs
const randomSuffix = Math.floor(Math.random() * 1000)
const id = `gunsmoke_${shooterId}_${shootingPointIndex}_${timestamp}_${randomSuffix}`
```

### Multi-Cannon Ships
Ships with multiple cannons automatically get separate particle effects:
```typescript
// Cannon 0 fires: gunsmoke_42_0_1703123456789_234
// Cannon 1 fires: gunsmoke_42_1_1703123456790_567
// Both can fire simultaneously without interference
```

### Multiple Ships Fighting
Each ship's weapons create independent particle effects:
```typescript
// Ship 42: gunsmoke_42_0_1703123456789_234
// Ship 58: gunsmoke_58_0_1703123456790_567  
// Ship 73: gunsmoke_73_1_1703123456791_891
// All render simultaneously with correct materials
```

## Sprite Requirements

The system expects these texture files:
- `assets/sprites/gunsmoke.png` - Smoke particle texture
- `assets/sprites/muzzleflash.png` - Flash particle texture

These should be single sprites or sprite sheets (the system supports both).