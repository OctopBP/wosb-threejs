import type { AudioAssets } from '../systems/AudioSystem'

/**
 * Audio configuration for the game
 * Using actual audio files added to the project
 */
export const audioAssets: AudioAssets = {
    // Background music
    music: {
        background: {
            url: '/assets/audio/music/Music.ogg',
            config: {
                volume: 1,
                loop: true,
            },
        },
    },

    // Sound effects
    sfx: {
        // Weapon shooting sound
        shoot: {
            url: '/assets/audio/sfx/Shoot.ogg',
            config: {
                volume: 1,
                loop: false,
            },
        },

        // Death/explosion sound
        death: {
            url: '/assets/audio/sfx/Death.ogg',
            config: {
                volume: 1.0,
                loop: false,
            },
        },

        // Level up sound
        level_up: {
            url: '/assets/audio/sfx/LevelUp.ogg',
            config: {
                volume: 1,
                loop: false,
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
    muted: true,
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
} as const
