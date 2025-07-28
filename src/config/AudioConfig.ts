import type { AudioAssets } from '../systems/AudioSystem'

/**
 * Audio configuration for the game
 * Using actual audio files added to the project
 */
export const audioAssets: AudioAssets = {
    // Background music
    music: {
        background: {
            url: 'assets/audio/music/Music.ogg',
            config: {
                volume: 1,
                loop: true,
                priority: 'low', // Background music can load last
            },
        },
    },

    // Sound effects
    sfx: {
        // Weapon shooting sound - high priority for immediate feedback
        shoot: {
            url: 'assets/audio/sfx/Shoot.ogg',
            config: {
                volume: 1,
                loop: false,
                priority: 'high', // Critical for gameplay feedback
            },
        },

        // Death/explosion sound - high priority for immediate feedback
        death: {
            url: 'assets/audio/sfx/Death.ogg',
            config: {
                volume: 1.0,
                loop: false,
                priority: 'high', // Critical for gameplay feedback
            },
        },

        // Level up sound - normal priority
        level_up: {
            url: 'assets/audio/sfx/LevelUp.ogg',
            config: {
                volume: 1,
                loop: false,
                priority: 'normal', // Important but not critical
            },
        },
    },

    // UI sounds - empty for now since no UI audio files provided
    ui: {},
}

/**
 * Default audio settings
 */
export const defaultAudioSettings = {
    masterVolume: 1.0,
    musicVolume: 0.5,
    sfxVolume: 0.5,
    uiVolume: 0.5,
    muted: false,
}

/**
 * Audio file format preferences in order of preference
 * The system will try to load the first format that's supported
 */
export const audioFormats = ['mp3', 'ogg', 'wav'] as const

/**
 * Audio system configuration
 */
export const audioSystemConfig = {
    // Maximum number of concurrent sound effects
    maxConcurrentSfx: 10,

    // Fade transition times (in seconds)
    musicFadeTime: 1.0,
    sfxFadeTime: 0.1,

    // 3D Audio settings
    defaultMaxDistance: 50,
    defaultRefDistance: 1,

    // Performance settings
    enablePositionalAudio: true,
    enableAudioCompression: true,
    
    // Preloading settings
    preloadHighPriorityFirst: true,
    maxConcurrentLoads: 4, // Limit concurrent downloads
    loadTimeout: 10000, // 10 seconds timeout per asset
} as const
