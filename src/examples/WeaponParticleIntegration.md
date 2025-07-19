# Weapon System Particle Integration

This document explains how the WeaponSystem is integrated with the ParticleSystem to create visual effects when weapons fire.

## Overview

The WeaponSystem now automatically creates particle effects when weapons fire, including:
- **Gunsmoke**: Realistic smoke particles that appear at the muzzle
- **Muzzle Flash**: Bright, short-lived flash particles for visual impact

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

## How It Works

### 1. System Initialization
When `setParticleSystem()` is called on WeaponSystem:
- Creates gunsmoke particle system configuration
- Creates muzzle flash particle system configuration
- Registers both particle systems with the ParticleSystem

### 2. Weapon Firing
When a weapon fires (either manual or auto-targeting):
- Calculates the world position of the shooting point
- Calculates the shooting direction
- Updates particle system positions and directions
- Triggers particle bursts

### 3. Particle Effects Flow
```typescript
// In WeaponSystem.fireProjectile() or fireProjectileToTarget()
this.playWeaponParticleEffects(worldShootingPos, { x: forwardX, z: forwardZ })

// Which calls:
this.particleSystem.updateParticleSystemPosition('gunsmoke', shootingPosition, shootingDirection)
this.particleSystem.burst('gunsmoke')
this.particleSystem.updateParticleSystemPosition('muzzleflash', shootingPosition, shootingDirection)  
this.particleSystem.burst('muzzleflash')
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

- Particle systems are reused and positioned dynamically
- Only burst emission is used (no continuous emission)
- Particles automatically clean up when their lifetime expires
- Multiple material groups are supported for different textures

## Sprite Requirements

The system expects these texture files:
- `assets/sprites/gunsmoke.png` - Smoke particle texture
- `assets/sprites/muzzleflash.png` - Flash particle texture

These should be single sprites or sprite sheets (the system supports both).