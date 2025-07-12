# Water System Documentation

## Overview

The water system implements cartoon-style animated water effects based on the Codrops article "Creating Stylized Water Effects with React Three Fiber". It features:

- **Cartoon-style shaders** with blue base and white sparkle effects
- **Detailed geometry animation** with multiple wave layers
- **Configurable parameters** for easy customization
- **Foam effects** around intersecting objects
- **Transparency with depth-based visibility**

## Architecture

### File Structure

```
src/
├── shaders/
│   └── water/
│       ├── vertex.glsl     # Water surface wave animation
│       └── fragment.glsl   # Cartoon-style water effects
├── materials/
│   └── WaterMaterial.ts    # Material creation and configuration
├── systems/
│   ├── WaterSystem.ts      # Water surface management
│   └── EnvironmentSystem.ts # Islands and debris
└── config/
    └── WaterConfig.ts      # Configuration and presets
```

### Key Components

1. **WaterSystem** - Manages the water surface mesh and animations
2. **WaterMaterial** - Creates shader materials from configuration
3. **EnvironmentSystem** - Handles islands and floating debris
4. **WaterConfig** - Provides configuration options and presets

## Configuration

### Basic Parameters

```typescript
interface WaterConfig {
    // Appearance
    colorNear: Color        // Near water color (default: cyan)
    colorFar: Color         // Far water color (default: blue)
    waterLevel: number      // Y position of water surface
    
    // Animation
    waveSpeed: number       // Speed of wave animation
    waveAmplitude: number   // Height of waves
    
    // Effects
    textureSize: number     // Scale of noise patterns
    foamDepth: number       // Height of foam around objects
    foamThreshold: number   // Threshold for foam generation
    
    // Performance
    geometrySegments: number // Water plane subdivision
    waterSize: number       // Size of water plane
}
```

### Usage Example

```typescript
// Create game world with custom water config
const gameWorldOptions: GameWorldOptions = {
    waterConfig: {
        waveSpeed: 1.5,
        waveAmplitude: 0.15,
        colorNear: new Color('#00ffff'),
        textureSize: 40
    }
}

const gameWorld = new GameWorld(scene, renderer, canvas, camera, gameWorldOptions)

// Update configuration at runtime
gameWorld.updateWaterConfig({
    waveSpeed: 2.0,
    foamDepth: 0.12
})
```

### Presets

The system includes several predefined presets:

- **Default** - Balanced settings for general use
- **Calm** - Peaceful water with gentle waves
- **Rough** - Stormy water with larger waves and more foam
- **Tropical** - Clear blue water with moderate animation

```typescript
import { waterPresets } from './config/WaterConfig'

// Apply a preset
gameWorld.getWaterSystem().applyPreset(waterPresets.tropical)
```

## Shader Details

### Vertex Shader Features

- **Multiple wave layers** for realistic water motion
- **Cross waves** for complex surface patterns
- **Configurable amplitude and speed**
- **World position calculation** for foam effects

### Fragment Shader Features

- **Perlin noise** for foam and wave patterns
- **Dynamic thresholds** for animated effects
- **Distance-based color mixing** for depth perception
- **Intersection foam** around objects at water level
- **Transparency with foam-based alpha**

## Performance Considerations

### Geometry Detail

The water system uses configurable geometry segments for the plane mesh:

- **Low detail**: 64x64 segments for mobile devices
- **Medium detail**: 128x128 segments (default)
- **High detail**: 256x256 segments for desktop

### Optimization Features

- **Efficient shader code** optimized for mobile GPUs
- **Configurable quality settings** via WaterConfig
- **LOD support** through geometry segments parameter
- **Minimal draw calls** (single water plane)

## Debug Controls

The debug GUI provides real-time water configuration:

1. **Water Level** - Adjust surface height
2. **Wave Speed** - Control animation speed
3. **Wave Amplitude** - Adjust wave height
4. **Texture Size** - Scale noise patterns
5. **Foam Depth** - Control foam thickness
6. **Color Controls** - Adjust near/far water colors
7. **Preset Switcher** - Apply predefined configurations

## Integration with Environment

### Islands and Debris

The EnvironmentSystem creates primitive objects that interact with water:

- **Islands** - Cylinder and sphere primitives
- **Floating debris** - Boxes, barrels, planks with gentle bobbing
- **Foam generation** - White foam appears around all objects at water level

### Automatic Updates

- Water level changes automatically update environment object positions
- Foam effects synchronize with wave animations
- Debris bobbing matches water surface movement

## Best Practices

### Configuration Guidelines

1. **Start with presets** - Use predefined configurations as a base
2. **Iterative tuning** - Adjust parameters gradually for desired effect
3. **Performance testing** - Monitor frame rates when increasing detail
4. **Color harmony** - Ensure water colors complement the overall scene

### Performance Tips

1. **Use appropriate geometry detail** for target platform
2. **Limit texture size** for complex noise patterns
3. **Balance wave complexity** vs. performance requirements
4. **Test on target devices** to validate performance

## Troubleshooting

### Common Issues

1. **Shader compilation errors** - Check GLSL syntax in shader files
2. **Performance drops** - Reduce geometry segments or texture complexity
3. **Visual artifacts** - Adjust foam thresholds and wave parameters
4. **Import errors** - Ensure vite-plugin-glsl is properly configured

### Debug Tools

- Use debug GUI for real-time parameter adjustment
- Enable wireframe mode to visualize geometry detail
- Monitor performance metrics during parameter changes
- Check browser console for shader compilation messages

## Future Enhancements

Potential improvements to the water system:

1. **Reflection rendering** - Add real-time reflections
2. **Caustics effects** - Underwater light patterns
3. **Weather integration** - Rain and storm effects
4. **Underwater rendering** - Submersion effects
5. **Dynamic LOD** - Automatic quality adjustment based on performance
