import type { Camera } from 'three'
import { Audio, AudioListener, AudioLoader, PositionalAudio } from 'three'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export interface AudioConfig {
    volume: number
    loop: boolean
    autoplay?: boolean
    maxDistance?: number // For positional audio
    refDistance?: number // For positional audio
    priority?: 'high' | 'normal' | 'low' // Loading priority
}

export interface AudioAsset {
    url: string
    config?: Partial<AudioConfig>
    buffer?: AudioBuffer
    loading?: boolean
    loaded?: boolean
    error?: string
}

export interface AudioAssets {
    music: Record<string, AudioAsset>
    sfx: Record<string, AudioAsset>
    ui: Record<string, AudioAsset>
}

export interface AudioLoadingProgress {
    total: number
    loaded: number
    failed: number
    percentage: number
    isComplete: boolean
}

export class AudioSystem extends System {
    private audioContext: AudioContext | null = null
    private audioListener: AudioListener | null = null
    private audioLoader: AudioLoader
    private assets: AudioAssets = { music: {}, sfx: {}, ui: {} }
    private loadedBuffers = new Map<string, AudioBuffer>()
    private playingAudio = new Map<string, Audio | PositionalAudio>()
    private masterVolume = 1.0
    private musicVolume = 0.7
    private sfxVolume = 0.8
    private uiVolume = 0.6
    private isInitialized = false
    private currentMusic: Audio | null = null
    private audioMuted = false
    
    // Preloading state
    private preloadStarted = false
    private preloadComplete = false
    private loadingProgress: AudioLoadingProgress = {
        total: 0,
        loaded: 0,
        failed: 0,
        percentage: 0,
        isComplete: false
    }
    private loadingCallbacks: Array<(progress: AudioLoadingProgress) => void> = []

    constructor(world: World) {
        super(world, []) // No required components for audio system
        this.audioLoader = new AudioLoader()
    }

    /**
     * Initialize the audio context early (can be called before user interaction)
     */
    async initializeContext(): Promise<void> {
        if (this.audioContext) return

        const startTime = performance.now()

        try {
            // Create AudioContext with user gesture requirement
            this.audioContext = new (
                window.AudioContext || (window as any).webkitAudioContext
            )()

            // Create AudioListener (will be attached to camera later)
            this.audioListener = new AudioListener()

            this.contextInitTime = performance.now() - startTime
            console.log(`🎵 Audio context initialized in ${this.contextInitTime.toFixed(2)}ms (ready for preloading)`)
        } catch (error) {
            console.error('Failed to initialize audio context:', error)
        }
    }

    /**
     * Complete initialization by attaching listener to camera
     * This must be called after user interaction due to Web Audio API policies
     */
    async completeInitialization(camera: Camera): Promise<void> {
        if (!this.audioContext || !this.audioListener) {
            console.warn('Audio context not initialized. Call initializeContext() first.')
            return
        }

        if (this.isInitialized) return

        try {
            // Attach listener to camera
            camera.add(this.audioListener)

            // Resume context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume()
            }

            this.isInitialized = true
            console.log('🎵 Audio system fully initialized')
        } catch (error) {
            console.error('Failed to complete audio initialization:', error)
        }
    }

    /**
     * Register audio assets and start preloading immediately
     */
    registerAssets(assets: AudioAssets): void {
        this.assets = { ...this.assets, ...assets }
        
        // Calculate total assets to load
        this.loadingProgress.total = Object.values(assets).reduce((total, category) => {
            return total + Object.keys(category).length
        }, 0)

        // Start preloading if context is ready
        if (this.audioContext && !this.preloadStarted) {
            this.startPreloading()
        }
    }

    /**
     * Start preloading all registered assets
     */
    private async startPreloading(): Promise<void> {
        if (this.preloadStarted) return

        this.preloadStarted = true
        this.preloadStartTime = performance.now()
        console.log('🎵 Starting audio asset preloading...')

        const priorityOrder: Array<'high' | 'normal' | 'low'> = ['high', 'normal', 'low']
        const maxConcurrent = 4 // Limit concurrent downloads
        const loadTimeout = 10000 // 10 seconds timeout

        // Group assets by priority
        const assetsByPriority = new Map<'high' | 'normal' | 'low', Array<{key: string, asset: AudioAsset}>>()
        
        for (const priority of priorityOrder) {
            assetsByPriority.set(priority, [])
        }

        // Categorize assets by priority
        for (const [category, categoryAssets] of Object.entries(this.assets)) {
            for (const [name, asset] of Object.entries(categoryAssets)) {
                const config = (asset as AudioAsset).config || {}
                const priority = config.priority || 'normal'
                const key = `${category}:${name}`
                assetsByPriority.get(priority)!.push({ key, asset: asset as AudioAsset })
            }
        }

        // Load assets by priority with concurrency control
        for (const priority of priorityOrder) {
            const assets = assetsByPriority.get(priority) || []
            if (assets.length === 0) continue

            console.log(`🎵 Loading ${priority} priority assets: ${assets.length} files`)

            // Load assets in batches to control concurrency
            for (let i = 0; i < assets.length; i += maxConcurrent) {
                const batch = assets.slice(i, i + maxConcurrent)
                const batchPromises = batch.map(({ key, asset }) => 
                    this.loadSingleAssetWithTimeout(key, asset, loadTimeout)
                )

                await Promise.allSettled(batchPromises)
            }
        }

        this.preloadComplete = true
        this.preloadCompleteTime = performance.now()
        this.loadingProgress.isComplete = true
        
        const totalTime = this.preloadCompleteTime - this.preloadStartTime
        console.log(`🎵 All audio assets preloaded successfully in ${totalTime.toFixed(2)}ms`)
    }

    /**
     * Load a single audio asset with timeout
     */
    private async loadSingleAssetWithTimeout(
        key: string,
        asset: AudioAsset,
        timeoutMs: number
    ): Promise<void> {
        return Promise.race([
            this.loadSingleAsset(key, asset),
            new Promise<void>((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Timeout loading ${key}`))
                }, timeoutMs)
            })
        ])
    }

    /**
     * Load a single audio asset with progress tracking
     */
    private async loadSingleAsset(
        key: string,
        asset: AudioAsset,
    ): Promise<void> {
        if (asset.loaded || asset.loading) return

        asset.loading = true
        asset.error = undefined

        return new Promise((resolve, reject) => {
            this.audioLoader.load(
                asset.url,
                (buffer) => {
                    this.loadedBuffers.set(key, buffer)
                    asset.buffer = buffer
                    asset.loaded = true
                    asset.loading = false
                    
                    this.loadingProgress.loaded++
                    this.updateLoadingProgress()
                    
                    resolve()
                },
                (_) => {
                    // Progress callback (optional)
                },
                (error) => {
                    console.error(`Failed to load audio asset ${key}:`, error)
                    asset.loading = false
                    asset.error = (error as Error).message
                    
                    this.loadingProgress.failed++
                    this.updateLoadingProgress()
                    
                    reject(error)
                },
            )
        })
    }

    /**
     * Update loading progress and notify callbacks
     */
    private updateLoadingProgress(): void {
        this.loadingProgress.percentage = Math.round(
            (this.loadingProgress.loaded / this.loadingProgress.total) * 100
        )

        // Notify all progress callbacks
        this.loadingCallbacks.forEach(callback => {
            try {
                callback({ ...this.loadingProgress })
            } catch (error) {
                console.error('Error in loading progress callback:', error)
            }
        })
    }

    /**
     * Subscribe to loading progress updates
     */
    onLoadingProgress(callback: (progress: AudioLoadingProgress) => void): void {
        this.loadingCallbacks.push(callback)
        
        // Immediately call with current progress
        callback({ ...this.loadingProgress })
    }

    /**
     * Get current loading progress
     */
    getLoadingProgress(): AudioLoadingProgress {
        return { ...this.loadingProgress }
    }

    /**
     * Check if preloading is complete
     */
    isPreloadComplete(): boolean {
        return this.preloadComplete
    }

    /**
     * Check if a specific sound is ready to play
     */
    isSoundReady(category: 'music' | 'sfx' | 'ui', name: string): boolean {
        const key = `${category}:${name}`
        return this.loadedBuffers.has(key)
    }

    /**
     * Get list of ready sounds
     */
    getReadySounds(): string[] {
        return Array.from(this.loadedBuffers.keys())
    }

    /**
     * Check if audio system is ready for use
     */
    isReady(): boolean {
        return this.isInitialized && this.preloadComplete
    }

    /**
     * Play a sound effect (with fallback if not loaded)
     */
    playSfx(name: string, config?: Partial<AudioConfig>): Audio | null {
        return this.playAudio('sfx', name, config)
    }

    /**
     * Play a UI sound
     */
    playUI(name: string, config?: Partial<AudioConfig>): Audio | null {
        return this.playAudio('ui', name, config)
    }

    /**
     * Play background music
     */
    playMusic(name: string, config?: Partial<AudioConfig>): Audio | null {
        // Stop current music if playing
        if (this.currentMusic?.isPlaying) {
            this.stopMusic()
        }

        const music = this.playAudio('music', name, { loop: true, ...config })
        if (music) {
            this.currentMusic = music
        }
        return music
    }

    /**
     * Stop the currently playing music
     */
    stopMusic(): void {
        if (this.currentMusic?.isPlaying) {
            this.currentMusic.stop()
            this.currentMusic = null
        }
    }

    /**
     * Pause the currently playing music
     */
    pauseMusic(): void {
        if (this.currentMusic?.isPlaying) {
            this.currentMusic.pause()
        }
    }

    /**
     * Resume the paused music
     */
    resumeMusic(): void {
        if (this.currentMusic && !this.currentMusic.isPlaying) {
            this.currentMusic.play()
        }
    }

    /**
     * Create a positional audio source (3D positioned audio)
     */
    createPositionalAudio(
        category: 'sfx' | 'ui',
        name: string,
        maxDistance = 50,
        refDistance = 1,
    ): PositionalAudio | null {
        if (!this.isInitialized || !this.audioListener) {
            console.warn('Audio system not initialized')
            return null
        }

        const key = `${category}:${name}`
        const buffer = this.loadedBuffers.get(key)

        if (!buffer) {
            console.warn(`Audio buffer not found: ${key}`)
            return null
        }

        const positionalAudio = new PositionalAudio(this.audioListener)
        positionalAudio.setBuffer(buffer)
        positionalAudio.setMaxDistance(maxDistance)
        positionalAudio.setRefDistance(refDistance)

        // Apply volume based on category
        const volume = this.getCategoryVolume(category)
        positionalAudio.setVolume(volume * this.masterVolume)

        return positionalAudio
    }

    private playAudio(
        category: 'music' | 'sfx' | 'ui',
        name: string,
        config?: Partial<AudioConfig>,
    ): Audio | null {
        if (!this.isInitialized || !this.audioListener) {
            console.warn('Audio system not initialized')
            return null
        }

        if (this.audioMuted) {
            return null
        }

        const key = `${category}:${name}`
        const buffer = this.loadedBuffers.get(key)

        if (!buffer) {
            console.warn(`Audio buffer not found: ${key}`)
            return null
        }

        // Get asset config
        const asset = this.assets[category][name]
        const finalConfig = {
            volume: 1.0,
            loop: false,
            autoplay: true,
            ...asset?.config,
            ...config,
        }

        // Create audio instance
        const audio = new Audio(this.audioListener)
        audio.setBuffer(buffer)
        audio.setLoop(finalConfig.loop)

        // Apply volume based on category
        const categoryVolume = this.getCategoryVolume(category)
        audio.setVolume(finalConfig.volume * categoryVolume * this.masterVolume)

        // Play audio
        if (finalConfig.autoplay) {
            audio.play()
        }

        // Track playing audio
        this.playingAudio.set(key, audio)

        // Remove from tracking when audio ends (if not looping)
        if (!finalConfig.loop) {
            setTimeout(() => {
                this.playingAudio.delete(key)
            }, buffer.duration * 1000)
        }

        return audio
    }

    private getCategoryVolume(category: 'music' | 'sfx' | 'ui'): number {
        switch (category) {
            case 'music':
                return this.musicVolume
            case 'sfx':
                return this.sfxVolume
            case 'ui':
                return this.uiVolume
            default:
                return 1.0
        }
    }

    /**
     * Volume controls
     */
    setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume))
        this.updateAllVolumes()
    }

    setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume))
        if (this.currentMusic) {
            this.currentMusic.setVolume(this.musicVolume * this.masterVolume)
        }
    }

    setSfxVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume))
        this.updateCategoryVolume('sfx')
    }

    setUIVolume(volume: number): void {
        this.uiVolume = Math.max(0, Math.min(1, volume))
        this.updateCategoryVolume('ui')
    }

    private updateAllVolumes(): void {
        // Update all playing audio
        for (const [key, audio] of this.playingAudio) {
            const [category] = key.split(':')
            const categoryVolume = this.getCategoryVolume(
                category as 'music' | 'sfx' | 'ui',
            )
            audio.setVolume(categoryVolume * this.masterVolume)
        }
    }

    private updateCategoryVolume(category: 'sfx' | 'ui'): void {
        const categoryVolume = this.getCategoryVolume(category)

        for (const [key, audio] of this.playingAudio) {
            if (key.startsWith(`${category}:`)) {
                audio.setVolume(categoryVolume * this.masterVolume)
            }
        }
    }

    /**
     * Mute/unmute all audio
     */
    setMuted(muted: boolean): void {
        this.audioMuted = muted

        if (muted) {
            // Stop all currently playing audio
            for (const audio of this.playingAudio.values()) {
                if (audio.isPlaying) {
                    audio.pause()
                }
            }
        } else {
            // Resume all paused audio
            for (const audio of this.playingAudio.values()) {
                if (!audio.isPlaying) {
                    audio.play()
                }
            }
        }
    }

    /**
     * Get volume levels
     */
    getMasterVolume(): number {
        return this.masterVolume
    }
    getMusicVolume(): number {
        return this.musicVolume
    }
    getSfxVolume(): number {
        return this.sfxVolume
    }
    getUIVolume(): number {
        return this.uiVolume
    }
    isMuted(): boolean {
        return this.audioMuted
    }

    /**
     * Stop all audio
     */
    stopAll(): void {
        for (const audio of this.playingAudio.values()) {
            if (audio.isPlaying) {
                audio.stop()
            }
        }
        this.playingAudio.clear()
        this.currentMusic = null
    }

    /**
     * Get audio system status
     */
    getStatus(): {
        initialized: boolean
        preloadComplete: boolean
        assetsLoaded: number
        currentlyPlaying: number
        musicPlaying: boolean
        loadingProgress: AudioLoadingProgress
    } {
        return {
            initialized: this.isInitialized,
            preloadComplete: this.preloadComplete,
            assetsLoaded: this.loadedBuffers.size,
            currentlyPlaying: this.playingAudio.size,
            musicPlaying: this.currentMusic?.isPlaying || false,
            loadingProgress: this.getLoadingProgress(),
        }
    }

    /**
     * Get performance metrics for the audio system
     */
    getPerformanceMetrics(): {
        contextInitTime: number
        preloadStartTime: number
        preloadCompleteTime: number
        totalLoadTime: number
        readySoundsCount: number
        failedLoadsCount: number
    } {
        return {
            contextInitTime: this.contextInitTime || 0,
            preloadStartTime: this.preloadStartTime || 0,
            preloadCompleteTime: this.preloadCompleteTime || 0,
            totalLoadTime: this.preloadCompleteTime ? this.preloadCompleteTime - this.preloadStartTime : 0,
            readySoundsCount: this.loadedBuffers.size,
            failedLoadsCount: this.loadingProgress.failed,
        }
    }

    // Performance tracking properties
    private contextInitTime: number = 0
    private preloadStartTime: number = 0
    private preloadCompleteTime: number = 0

    update(_deltaTime: number): void {}

    destroy(): void {
        this.stopAll()

        if (this.audioListener) {
            // Remove from camera
            if (this.audioListener.parent) {
                this.audioListener.parent.remove(this.audioListener)
            }
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close()
        }

        this.loadedBuffers.clear()
        this.playingAudio.clear()
        this.loadingCallbacks.splice(0)
        this.isInitialized = false
        this.preloadComplete = false
        this.preloadStarted = false
    }
}
