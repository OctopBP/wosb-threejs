# Audio System Usage Guide

The audio system provides a simple yet powerful way to add sound effects and background music to your Three.js game. It's built on top of the Web Audio API and Three.js Audio classes.

## Features

- **Background Music**: Looping music tracks with seamless playback
- **Sound Effects**: One-shot and looping sound effects
- **UI Sounds**: Interface feedback sounds
- **Volume Controls**: Separate volume controls for each category
- **Positional Audio**: 3D positioned audio sources (optional)
- **Automatic Loading**: Preload all audio assets with progress tracking
- **Cross-browser Compatibility**: Handles Web Audio API autoplay policies

## Basic Setup

The audio system is automatically initialized when the GameWorld is created. It will start working after the first user interaction (click, touch, or key press) due to browser autoplay policies.

### Adding Audio Assets

1. **Place audio files** in `public/assets/audio/` directory:
   ```
   public/assets/audio/
   ├── music/
   │   ├── background.mp3
   │   ├── menu.mp3
   │   └── battle.mp3
   ├── sfx/
   │   ├── laser_shoot.mp3
   │   ├── enemy_explosion.mp3
   │   └── level_up.mp3
   └── ui/
       ├── button_click.mp3
       └── notification.mp3
   ```

2. **Register assets** in `src/config/AudioConfig.ts`:
   ```typescript
   export const audioAssets: AudioAssets = {
     music: {
       background: {
         url: '/assets/audio/music/background.mp3',
         config: { volume: 0.6, loop: true }
       }
     },
     sfx: {
       laser_shoot: {
         url: '/assets/audio/sfx/laser_shoot.mp3',
         config: { volume: 0.8, loop: false }
       }
     },
     ui: {
       button_click: {
         url: '/assets/audio/ui/button_click.mp3',
         config: { volume: 0.7, loop: false }
       }
     }
   }
   ```

## Using the Audio System

### Getting the Audio System

```typescript
// From GameWorld
const audioSystem = gameWorld.getAudioSystem()

// Check if audio is ready
if (gameWorld.isAudioInitialized()) {
  // Audio is ready to use
}
```

### Playing Sounds

```typescript
// Play background music
audioSystem.playMusic('background')

// Play sound effects
audioSystem.playSfx('laser_shoot')
audioSystem.playSfx('enemy_explosion')

// Play UI sounds
audioSystem.playUI('button_click')

// Play with custom config
audioSystem.playSfx('explosion', { volume: 1.2 })
```

### Music Controls

```typescript
// Play music
audioSystem.playMusic('battle')

// Stop current music
audioSystem.stopMusic()

// Pause music
audioSystem.pauseMusic()

// Resume music
audioSystem.resumeMusic()
```

### Volume Controls

```typescript
// Set master volume (0.0 - 1.0)
audioSystem.setMasterVolume(0.8)

// Set category volumes
audioSystem.setMusicVolume(0.6)
audioSystem.setSfxVolume(0.9)
audioSystem.setUIVolume(0.7)

// Get current volumes
const masterVol = audioSystem.getMasterVolume()
const musicVol = audioSystem.getMusicVolume()
```

### Mute/Unmute

```typescript
// Mute all audio
audioSystem.setMuted(true)

// Unmute
audioSystem.setMuted(false)

// Check if muted
if (audioSystem.isMuted()) {
  // Audio is muted
}
```

## Integration with Game Systems

### Adding Audio to Custom Systems

1. **Import AudioSystem type**:
   ```typescript
   import type { AudioSystem } from './AudioSystem'
   ```

2. **Add audio system property**:
   ```typescript
   export class MyCustomSystem extends System {
     private audioSystem: AudioSystem | null = null
     
     setAudioSystem(audioSystem: AudioSystem): void {
       this.audioSystem = audioSystem
     }
   }
   ```

3. **Connect in GameWorld**:
   ```typescript
   // In GameWorld constructor
   this.myCustomSystem.setAudioSystem(this.audioSystem)
   ```

4. **Use in system logic**:
   ```typescript
   private playCustomSound(): void {
     if (!this.audioSystem) return
     this.audioSystem.playSfx('my_sound')
   }
   ```

### Example: Weapon System Integration

```typescript
// In WeaponSystem.ts
private playWeaponSound(weaponType: string): void {
  if (!this.audioSystem) return

  const soundMap: Record<string, string> = {
    'laser': 'laser_shoot',
    'missile': 'missile_shoot',
    'cannon': 'cannon_shoot'
  }

  const soundName = soundMap[weaponType] || 'laser_shoot'
  this.audioSystem.playSfx(soundName)
}

// Called when firing
this.playWeaponSound(weapon.weaponType)
```

## Positional Audio (3D Audio)

For more advanced 3D positioned audio:

```typescript
// Create positional audio
const positionalAudio = audioSystem.createPositionalAudio(
  'sfx', 
  'engine_sound',
  50,  // maxDistance
  1    // refDistance
)

if (positionalAudio) {
  // Add to a 3D object
  someObject3D.add(positionalAudio)
  positionalAudio.play()
}
```

## Performance Considerations

### Audio File Formats
- **MP3**: Best compatibility, good compression
- **OGG**: Better compression, open source, not supported on Safari
- **WAV**: Uncompressed, larger files, use sparingly

### File Size Optimization
- Keep sound effects under 500KB each
- Compress music files (aim for 1-3MB per track)
- Use appropriate sample rates (22-44kHz for most sounds)
- Consider shorter loop lengths for background music

### Memory Management
```typescript
// Stop all audio when cleaning up
audioSystem.stopAll()

// The system automatically cleans up when destroyed
audioSystem.destroy()
```

## Audio System Status

```typescript
// Get system status
const status = audioSystem.getStatus()
console.log('Initialized:', status.initialized)
console.log('Assets loaded:', status.assetsLoaded)
console.log('Currently playing:', status.currentlyPlaying)
console.log('Music playing:', status.musicPlaying)
```

## Troubleshooting

### Common Issues

1. **No sound after clicking**:
   - Check browser console for audio context errors
   - Ensure audio files exist at specified URLs
   - Verify file formats are supported

2. **Audio cuts off**:
   - Check if multiple instances are playing
   - Verify volume levels aren't set to 0
   - Check if audio is being stopped elsewhere

3. **Performance issues**:
   - Reduce number of concurrent sound effects
   - Use shorter audio files
   - Lower audio quality if needed

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Good support (no OGG format)
- **Mobile**: May require user interaction first

### Debugging

```typescript
// Enable audio debug logging
console.log('Audio System Status:', audioSystem.getStatus())

// Check if audio context is running
console.log('Audio Context State:', audioSystem.audioContext?.state)

// Monitor playing audio
console.log('Currently Playing:', audioSystem.playingAudio.size)
```

## Best Practices

1. **Always check if audio system exists** before using
2. **Use appropriate volume levels** for each sound type
3. **Preload critical sounds** during game loading
4. **Provide volume controls** for users
5. **Respect user preferences** (mute settings)
6. **Test on multiple devices** and browsers
7. **Consider accessibility** - provide visual feedback for audio cues

## Example Implementation

Here's a complete example of adding audio to a button click:

```typescript
// In your UI system or component
class UIButton {
  constructor(private audioSystem: AudioSystem | null) {}
  
  onClick() {
    // Play UI click sound
    this.audioSystem?.playUI('button_click')
    
    // Handle button logic
    this.handleButtonAction()
  }
  
  onHover() {
    // Play subtle hover sound
    this.audioSystem?.playUI('button_hover')
  }
}
```

This audio system provides a solid foundation for adding immersive sound to your game while maintaining simplicity and performance.