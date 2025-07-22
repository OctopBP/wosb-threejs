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

    constructor(world: World) {
        super(world, []) // No required components for audio system
        this.audioLoader = new AudioLoader()
    }

    /**
     * Initialize the audio system. This must be called after user interaction
     * due to Web Audio API autoplay policies.
     */
    async initialize(camera: Camera): Promise<void> {
        if (this.isInitialized) return

        try {
            // Create AudioContext
            this.audioContext = new (
                window.AudioContext || (window as any).webkitAudioContext
            )()

            // Create AudioListener and attach to camera
            this.audioListener = new AudioListener()
            camera.add(this.audioListener)

            // Resume context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume()
            }

            this.isInitialized = true
            console.log('Audio system initialized successfully')
        } catch (error) {
            console.error('Failed to initialize audio system:', error)
        }
    }

    /**
     * Register audio assets to be loaded
     */
    registerAssets(assets: AudioAssets): void {
        this.assets = { ...this.assets, ...assets }
    }

    /**
     * Load all registered audio assets
     */
    async loadAssets(): Promise<void> {
        if (!this.isInitialized) {
            console.warn(
                'Audio system not initialized. Call initialize() first.',
            )
            return
        }

        const loadPromises: Promise<void>[] = []

        // Load all asset types
        for (const [category, categoryAssets] of Object.entries(this.assets)) {
            for (const [name, asset] of Object.entries(categoryAssets)) {
                const key = `${category}:${name}`
                loadPromises.push(
                    this.loadSingleAsset(key, asset as AudioAsset),
                )
            }
        }

        try {
            await Promise.all(loadPromises)
            console.log('All audio assets loaded successfully')
        } catch (error) {
            console.error('Failed to load some audio assets:', error)
        }
    }

    private async loadSingleAsset(
        key: string,
        asset: AudioAsset,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            this.audioLoader.load(
                asset.url,
                (buffer) => {
                    this.loadedBuffers.set(key, buffer)
                    asset.buffer = buffer
                    resolve()
                },
                (_) => {},
                (error) => {
                    console.error(`Failed to load audio asset ${key}:`, error)
                    reject(error)
                },
            )
        })
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
        assetsLoaded: number
        currentlyPlaying: number
        musicPlaying: boolean
    } {
        return {
            initialized: this.isInitialized,
            assetsLoaded: this.loadedBuffers.size,
            currentlyPlaying: this.playingAudio.size,
            musicPlaying: this.currentMusic?.isPlaying || false,
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
    }
}
