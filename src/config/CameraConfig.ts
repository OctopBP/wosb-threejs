// Camera configuration for different game states
export interface CameraState {
    name: string
    position: {
        x: number
        y: number
        z: number
    }
    target: {
        x: number
        y: number
        z: number
    }
    fov: number
    transitionDuration: number // seconds
    transitionEasing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut'
    // Optional screen shake parameters
    screenShake?: {
        intensity: number
        frequency: number
        duration: number
    }
    // Optional zoom parameters
    zoom?: {
        targetFOV: number
        duration: number
    }
}

// Camera system configuration
export interface CameraConfig {
    // Default camera states
    states: {
        playerFocus: CameraState
        enemyFocus: CameraState
        bossPreview: CameraState
        cinematic: CameraState
    }

    // Global camera settings
    global: {
        defaultFOV: number
        nearPlane: number
        farPlane: number
        aspectRatio: number
        // Mobile-specific adjustments
        mobileAdjustments: {
            fovMultiplier: number
            heightOffset: number
            distanceMultiplier: number
        }
    }

    // Screen shake presets
    screenShakePresets: {
        light: {
            intensity: number
            frequency: number
            duration: number
        }
        medium: {
            intensity: number
            frequency: number
            duration: number
        }
        heavy: {
            intensity: number
            frequency: number
            duration: number
        }
        boss: {
            intensity: number
            frequency: number
            duration: number
        }
    }

    // Zoom presets
    zoomPresets: {
        close: {
            targetFOV: number
            duration: number
        }
        medium: {
            targetFOV: number
            duration: number
        }
        far: {
            targetFOV: number
            duration: number
        }
        cinematic: {
            targetFOV: number
            duration: number
        }
    }
}

// Default camera configuration
export const defaultCameraConfig: CameraConfig = {
    states: {
        playerFocus: {
            name: 'playerFocus',
            position: { x: 0, y: 15, z: -8 },
            target: { x: 0, y: 0, z: 0 },
            fov: 60,
            transitionDuration: 1.0,
            transitionEasing: 'easeInOut',
            screenShake: {
                intensity: 0.1,
                frequency: 10,
                duration: 0.2,
            },
        },
        enemyFocus: {
            name: 'enemyFocus',
            position: { x: 0, y: 15, z: -15 },
            target: { x: 0, y: 0, z: 0 },
            fov: 45,
            transitionDuration: 1.5,
            transitionEasing: 'easeInOut',
            zoom: {
                targetFOV: 35,
                duration: 2.0,
            },
        },
        bossPreview: {
            name: 'bossPreview',
            position: { x: 0, y: 20, z: -20 },
            target: { x: 0, y: 0, z: 0 },
            fov: 40,
            transitionDuration: 2.0,
            transitionEasing: 'easeIn',
            screenShake: {
                intensity: 0.3,
                frequency: 8,
                duration: 0.5,
            },
            zoom: {
                targetFOV: 30,
                duration: 3.0,
            },
        },
        cinematic: {
            name: 'cinematic',
            position: { x: 0, y: 18, z: -25 },
            target: { x: 0, y: 0, z: 0 },
            fov: 35,
            transitionDuration: 2.5,
            transitionEasing: 'easeInOut',
            zoom: {
                targetFOV: 25,
                duration: 4.0,
            },
        },
    },

    global: {
        defaultFOV: 50,
        nearPlane: 0.1,
        farPlane: 1000,
        aspectRatio: 16 / 9,
        mobileAdjustments: {
            fovMultiplier: 1.1,
            heightOffset: 2,
            distanceMultiplier: 1.2,
        },
    },

    screenShakePresets: {
        light: {
            intensity: 0.05,
            frequency: 15,
            duration: 0.3,
        },
        medium: {
            intensity: 0.15,
            frequency: 12,
            duration: 0.5,
        },
        heavy: {
            intensity: 0.25,
            frequency: 10,
            duration: 0.8,
        },
        boss: {
            intensity: 0.4,
            frequency: 8,
            duration: 1.2,
        },
    },

    zoomPresets: {
        close: {
            targetFOV: 35,
            duration: 1.0,
        },
        medium: {
            targetFOV: 45,
            duration: 1.5,
        },
        far: {
            targetFOV: 60,
            duration: 1.0,
        },
        cinematic: {
            targetFOV: 25,
            duration: 2.5,
        },
    },
}
