// Camera configuration for different game states
export interface CameraState {
    name: string
    offset: {
        x: number
        y: number
        z: number
    }
    fov: number
}

// Camera system configuration
export interface CameraConfig {
    states: {
        playerFocus: CameraState
        bossPreview: CameraState
    }
}

// Default camera configuration
export const defaultCameraConfig: CameraConfig = {
    states: {
        playerFocus: {
            name: 'playerFocus',
            offset: { x: 0, y: 25, z: -12 },
            fov: 60,
        },
        bossPreview: {
            name: 'bossPreview',
            offset: { x: 0, y: 20, z: -20 },
            fov: 60,
        },
    },
}
