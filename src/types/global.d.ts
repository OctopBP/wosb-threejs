declare global {
    interface Window {
        bridge?: {
            initialize(): Promise<void>
        }
        webkitAudioContext: typeof AudioContext
    }
}

export {}
