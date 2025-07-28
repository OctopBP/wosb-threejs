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
}

export interface AudioAsset {
    url: string
    config?: Partial<AudioConfig>
    buffer?: AudioBuffer
}

export interface AudioAssets {
    music: Record<string, AudioAsset>
    sfx: Record<string, AudioAsset>
    ui: Record<string, AudioAsset>
}

export interface AudioLoadingProgress {
    totalAssets: number
    loadedAssets: number
    loadingProgress: number // 0-1
    isComplete: boolean
    errors: string[]
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
    private loadingProgress: AudioLoadingProgress = {
        totalAssets: 0,
        loadedAssets: 0,
        loadingProgress: 0,
        isComplete: false,
        errors: [],
    }
    private loadingCallbacks: ((progress: AudioLoadingProgress) => void)[] = []

    constructor(world: World) {
        super(world, []) // No required components for audio system
        this.audioLoader = new AudioLoader()
    }

    /**
     * Initialize the audio system immediately without waiting for user interaction
     */
    async initialize(camera: Camera): Promise<void> {
        if (this.isInitialized) return

        try {
            // Create AudioContext with immediate initialization
            this.audioContext = new (
                window.AudioContext || (window as any).webkitAudioContext
            )()

            // Create AudioListener and attach to camera
            this.audioListener = new AudioListener()
            camera.add(this.audioListener)

            // Resume context immediately (works in most modern browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume()
            }

            this.isInitialized = true
            console.log('🎵 Audio system initialized successfully')
        } catch (error) {
            console.error('Failed to initialize audio system:', error)
            // Continue anyway - audio will work once user interacts
        }
    }

    /**
     * Register audio assets to be loaded
     */
    registerAssets(assets: AudioAssets): void {
        this.assets = { ...this.assets, ...assets }
    }

    /**
     * Start preloading all audio assets immediately
     */
    async preloadAssets(): Promise<void> {
        // Calculate total assets
        const allAssets = [
            ...Object.entries(this.assets.music),
            ...Object.entries(this.assets.sfx),
            ...Object.entries(this.assets.ui),
        ]

        this.loadingProgress.totalAssets = allAssets.length
        this.loadingProgress.loadedAssets = 0
        this.loadingProgress.loadingProgress = 0
        this.loadingProgress.isComplete = false
        this.loadingProgress.errors = []

        if (allAssets.length === 0) {
            this.loadingProgress.isComplete = true
            this.loadingProgress.loadingProgress = 1
            this.notifyLoadingProgress()
            return
        }

        console.log(
            `🎵 Starting preload of ${allAssets.length} audio assets...`,
        )

        // Load all assets concurrently with progress tracking
        const loadPromises = allAssets.map(([name, asset], index) =>
            this.loadSingleAssetWithProgress(
                name,
                asset,
                index,
                allAssets.length,
            ),
        )

        try {
            await Promise.allSettled(loadPromises)
            this.loadingProgress.isComplete = true
            this.loadingProgress.loadingProgress = 1
            this.notifyLoadingProgress()
            console.log(
                `🎵 Audio preload complete! Loaded ${this.loadedBuffers.size}/${allAssets.length} assets`,
            )
        } catch (error) {
            console.error('Failed to load some audio assets:', error)
            this.loadingProgress.errors.push(
                error instanceof Error ? error.message : 'Unknown error',
            )
        }
    }

    private async loadSingleAssetWithProgress(
        name: string,
        asset: AudioAsset,
        index: number,
        total: number,
    ): Promise<void> {
        try {
            await this.loadSingleAsset(name, asset)
            this.loadingProgress.loadedAssets++
            this.loadingProgress.loadingProgress =
                this.loadingProgress.loadedAssets / total
            this.notifyLoadingProgress()
        } catch (error) {
            console.error(`Failed to load audio asset ${name}:`, error)
            this.loadingProgress.errors.push(
                `Failed to load ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            )
        }
    }

    private async loadSingleAsset(
        name: string,
        asset: AudioAsset,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            this.audioLoader.load(
                asset.url,
                (buffer) => {
                    this.loadedBuffers.set(name, buffer)
                    asset.buffer = buffer
                    resolve()
                },
                (progress) => {
                    // Individual asset loading progress (optional)
                },
                (error) => {
                    console.error(`Failed to load audio asset ${name}:`, error)
                    reject(error)
                },
            )
        })
    }

    /**
     * Get current loading progress
     */
    getLoadingProgress(): AudioLoadingProgress {
        return { ...this.loadingProgress }
    }

    /**
     * Subscribe to loading progress updates
     */
    onLoadingProgress(
        callback: (progress: AudioLoadingProgress) => void,
    ): void {
        this.loadingCallbacks.push(callback)
    }

    private notifyLoadingProgress(): void {
        this.loadingCallbacks.forEach((callback) =>
            callback(this.getLoadingProgress()),
        )
    }

    /**
     * Check if audio system is ready to play sounds
     */
    isReady(): boolean {
        return this.isInitialized && this.loadingProgress.isComplete
    }

    /**
     * Play a sound effect
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
        if (!this.isReady() || !this.audioListener) {
            console.warn('Audio system not ready')
            return null
        }

        const buffer = this.loadedBuffers.get(name)

        if (!buffer) {
            console.warn(`Audio buffer not found: ${name}`)
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
        if (!this.isReady() || !this.audioListener) {
            console.warn('Audio system not ready')
            return null
        }

        if (this.audioMuted) {
            return null
        }

        const buffer = this.loadedBuffers.get(name)

        if (!buffer) {
            console.warn(`Audio buffer not found: ${name}`)
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
        this.playingAudio.set(name, audio)

        // Remove from tracking when audio ends (if not looping)
        if (!finalConfig.loop) {
            setTimeout(() => {
                this.playingAudio.delete(name)
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
        ready: boolean
        assetsLoaded: number
        totalAssets: number
        currentlyPlaying: number
        musicPlaying: boolean
        loadingProgress: number
    } {
        return {
            initialized: this.isInitialized,
            ready: this.isReady(),
            assetsLoaded: this.loadedBuffers.size,
            totalAssets: this.loadingProgress.totalAssets,
            currentlyPlaying: this.playingAudio.size,
            musicPlaying: this.currentMusic?.isPlaying || false,
            loadingProgress: this.loadingProgress.loadingProgress,
        }
    }

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
        this.isInitialized = false
        this.loadingCallbacks = []
    }
}
