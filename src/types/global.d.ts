declare global {
    interface Window {
        bridge?: {
            initialize(): Promise<void>
            platform?: {
                language?: string
            }
        }
        webkitAudioContext: typeof AudioContext
    }
}

export {}
