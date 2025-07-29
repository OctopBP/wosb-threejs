declare global {
    interface Window {
        PG: {
            init: () => Promise<void>
            ready: boolean
            isReady: () => boolean
            gameLoadingStart: () => void
            gameLoadingFinished: () => void
            gameplayStart: () => void
            gameplayStop: () => void
            getPlayerData: () => Promise<any>
            setPlayerData: (data: any) => Promise<void>
            on: (event: string, callback: Function) => void
            off: (event: string, callback: Function) => void
        }
    }
}

export interface PlaygamaConfig {
    onReady?: () => void
    onGameStart?: () => void
    onGamePause?: () => void
    onGameResume?: () => void
}

export class PlaygamaSDK {
    private static instance: PlaygamaSDK
    private initialized = false
    private config: PlaygamaConfig = {}

    private constructor() {}

    static getInstance(): PlaygamaSDK {
        if (!PlaygamaSDK.instance) {
            PlaygamaSDK.instance = new PlaygamaSDK()
        }
        return PlaygamaSDK.instance
    }

    async initialize(config: PlaygamaConfig = {}): Promise<void> {
        if (this.initialized) {
            console.warn('Playgama SDK already initialized')
            return
        }

        this.config = config

        try {
            if (typeof window !== 'undefined' && window.PG) {
                console.log('Initializing Playgama SDK...')

                // Initialize the SDK
                await window.PG.init()

                // Setup event listeners
                this.setupEventListeners()

                this.initialized = true
                console.log('Playgama SDK initialized successfully')

                if (this.config.onReady) {
                    this.config.onReady()
                }
            } else {
                console.warn(
                    'Playgama SDK not found. Game will run without SDK features.',
                )
            }
        } catch (error) {
            console.error('Failed to initialize Playgama SDK:', error)
        }
    }

    private setupEventListeners(): void {
        if (!window.PG) return

        // Listen for game pause/resume events
        window.PG.on('pause', () => {
            console.log('Game paused by platform')
            if (this.config.onGamePause) {
                this.config.onGamePause()
            }
        })

        window.PG.on('resume', () => {
            console.log('Game resumed by platform')
            if (this.config.onGameResume) {
                this.config.onGameResume()
            }
        })
    }

    isInitialized(): boolean {
        return this.initialized && window.PG?.isReady()
    }

    gameLoadingStart(): void {
        if (this.isInitialized()) {
            window.PG.gameLoadingStart()
            console.log('Game loading started')
        }
    }

    gameLoadingFinished(): void {
        if (this.isInitialized()) {
            window.PG.gameLoadingFinished()
            console.log('Game loading finished')
        }
    }

    gameplayStart(): void {
        if (this.isInitialized()) {
            window.PG.gameplayStart()
            console.log('Gameplay started')
            if (this.config.onGameStart) {
                this.config.onGameStart()
            }
        }
    }

    gameplayStop(): void {
        if (this.isInitialized()) {
            window.PG.gameplayStop()
            console.log('Gameplay stopped')
        }
    }

    async savePlayerData(data: any): Promise<void> {
        if (this.isInitialized()) {
            try {
                await window.PG.setPlayerData(data)
                console.log('Player data saved successfully')
            } catch (error) {
                console.error('Failed to save player data:', error)
            }
        }
    }

    async loadPlayerData(): Promise<any> {
        if (this.isInitialized()) {
            try {
                const data = await window.PG.getPlayerData()
                console.log('Player data loaded successfully')
                return data
            } catch (error) {
                console.error('Failed to load player data:', error)
                return null
            }
        }
        return null
    }
}
