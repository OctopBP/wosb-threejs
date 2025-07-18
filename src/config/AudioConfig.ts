import type { AudioAssets } from '../systems/AudioSystem'

/**
 * Audio configuration for the game
 * Add your audio assets here with their file paths and configurations
 */
export const audioAssets: AudioAssets = {
    // Background music
    music: {
        // Example music tracks - replace with your actual files
        background: {
            url: '/assets/audio/music/background.mp3',
            config: {
                volume: 0.6,
                loop: true
            }
        },
        menu: {
            url: '/assets/audio/music/menu.mp3',
            config: {
                volume: 0.5,
                loop: true
            }
        },
        battle: {
            url: '/assets/audio/music/battle.mp3',
            config: {
                volume: 0.7,
                loop: true
            }
        }
    },

    // Sound effects
    sfx: {
        // Weapon sounds
        laser_shoot: {
            url: '/assets/audio/sfx/laser_shoot.mp3',
            config: {
                volume: 0.8,
                loop: false
            }
        },
        missile_shoot: {
            url: '/assets/audio/sfx/missile_shoot.mp3',
            config: {
                volume: 0.9,
                loop: false
            }
        },
        
        // Explosion sounds
        enemy_explosion: {
            url: '/assets/audio/sfx/enemy_explosion.mp3',
            config: {
                volume: 1.0,
                loop: false
            }
        },
        projectile_hit: {
            url: '/assets/audio/sfx/projectile_hit.mp3',
            config: {
                volume: 0.7,
                loop: false
            }
        },
        
        // Player sounds
        player_hit: {
            url: '/assets/audio/sfx/player_hit.mp3',
            config: {
                volume: 0.8,
                loop: false
            }
        },
        engine_boost: {
            url: '/assets/audio/sfx/engine_boost.mp3',
            config: {
                volume: 0.6,
                loop: false
            }
        },
        
        // Level events
        level_up: {
            url: '/assets/audio/sfx/level_up.mp3',
            config: {
                volume: 0.9,
                loop: false
            }
        },
        enemy_spawn: {
            url: '/assets/audio/sfx/enemy_spawn.mp3',
            config: {
                volume: 0.5,
                loop: false
            }
        },
        pickup_xp: {
            url: '/assets/audio/sfx/pickup_xp.mp3',
            config: {
                volume: 0.6,
                loop: false
            }
        }
    },

    // UI sounds
    ui: {
        button_click: {
            url: '/assets/audio/ui/button_click.mp3',
            config: {
                volume: 0.7,
                loop: false
            }
        },
        button_hover: {
            url: '/assets/audio/ui/button_hover.mp3',
            config: {
                volume: 0.5,
                loop: false
            }
        },
        notification: {
            url: '/assets/audio/ui/notification.mp3',
            config: {
                volume: 0.8,
                loop: false
            }
        },
        error: {
            url: '/assets/audio/ui/error.mp3',
            config: {
                volume: 0.8,
                loop: false
            }
        },
        success: {
            url: '/assets/audio/ui/success.mp3',
            config: {
                volume: 0.8,
                loop: false
            }
        }
    }
}

/**
 * Default audio settings
 */
export const defaultAudioSettings = {
    masterVolume: 1.0,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    uiVolume: 0.6,
    muted: false
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
    enableAudioCompression: true
} as const