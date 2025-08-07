import type { Camera } from 'three'
import { Audio, AudioListener, PositionalAudio } from 'three'
import { getAudioBuffer } from '../AssetsPreloader'
import { AUDIO_ASSETS } from '../config/AudioConfig'
import { System } from '../ecs/System'

import type { World } from '../ecs/World'
export interface AudioConfig {
    volume: number
    loop: boolean
    autoplay?: boolean
    maxDistance?: number
    refDistance?: number
}

export interface AudioAsset {
    url: string
    config?: Partial<AudioConfig>
    buffer?: AudioBuffer
}

export interface AudioAssets {
    music: Record<string, AudioAsset>
    sfx: Record<string, AudioAsset>
}

export class AudioSystem extends System {
    private audioContext: AudioContext | null = null
    private audioListener: AudioListener | null = null
    private playingAudio = new Map<string, Audio | PositionalAudio>()
    private masterVolume = 1.0
    private musicVolume = 0.7
    private sfxVolume = 0.8
    private uiVolume = 0.6
    private isInitialized = false
    private currentMusic: Audio | null = null
    private audioMuted = false

    constructor(world: World) {
        super(world, [])
    }

    /**
     * Initialize the audio system. This must be called after user interaction
     * due to Web Audio API autoplay policies.
     */
    async initialize(camera: Camera): Promise<void> {
        if (this.isInitialized) return

        try {
            console.log('Initializing audio system...')

            // Create AudioContext
            this.audioContext = new (
                window.AudioContext || window.webkitAudioContext
            )()

            console.log('AudioContext created, state:', this.audioContext.state)

            // Create AudioListener and attach to camera
            this.audioListener = new AudioListener()
            camera.add(this.audioListener)

            // Resume context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                console.log('AudioContext suspended, attempting to resume...')
                await this.audioContext.resume()
                console.log('AudioContext resumed:', this.audioContext.state)
            }

            // Additional check for mobile browsers
            if (this.audioContext.state !== 'running') {
                console.warn(
                    'AudioContext not running. State:',
                    this.audioContext.state,
                )
                console.warn('Audio may not work until user interaction')
            }

            this.isInitialized = true
            console.log('Audio system initialized successfully')

            // Log available audio buffers
            console.log(
                'Available audio buffers:',
                this.getLoadedAudioBuffers(),
            )
        } catch (error) {
            console.error('Failed to initialize audio system:', error)
        }
    }

    /**
     * Force resume the audio context if it's suspended
     * Useful for mobile devices that may suspend the context
     */
    public async resumeContextIfNeeded(): Promise<void> {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume()
            console.log('AudioContext force resumed:', this.audioContext.state)
        }
    }

    /**
     * Check if audio system is ready to play
     */
    public isReady(): boolean {
        return (
            this.isInitialized &&
            this.audioContext?.state === 'running' &&
            !this.audioMuted
        )
    }

    /**
     * Check if a specific audio buffer is loaded
     */
    public isAudioBufferLoaded(name: string): boolean {
        return getAudioBuffer(name) !== undefined
    }

    playSfx(name: string, config?: Partial<AudioConfig>): Audio | null {
        return this.playAudio('sfx', name, config)
    }

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
     * Try to play music with retry logic for mobile devices
     */
    async playMusicWithRetry(
        name: string,
        config?: Partial<AudioConfig>,
        maxRetries = 3,
    ): Promise<Audio | null> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const music = this.playMusic(attempt === 1 ? name : name, config)

            if (music?.isPlaying) {
                console.log(`Music started successfully on attempt ${attempt}`)
                return music
            }

            if (attempt < maxRetries) {
                console.log(`Music attempt ${attempt} failed, retrying...`)
                await new Promise((resolve) => setTimeout(resolve, 500))

                // Try to resume context before retry
                await this.resumeContextIfNeeded()
            }
        }

        console.warn(`Failed to play music after ${maxRetries} attempts`)
        return null
    }

    stopMusic(): void {
        if (this.currentMusic?.isPlaying) {
            this.currentMusic.stop()
            this.currentMusic = null
        }
    }

    pauseMusic(): void {
        if (this.currentMusic?.isPlaying) {
            this.currentMusic.pause()
        }
    }

    resumeMusic(): void {
        if (this.currentMusic && !this.currentMusic.isPlaying) {
            this.currentMusic.play()
        }
    }

    createPositionalAudio(
        category: 'sfx',
        name: string,
        maxDistance = 50,
        refDistance = 1,
    ): PositionalAudio | null {
        if (!this.isInitialized || !this.audioListener) {
            console.warn('Audio system not initialized')
            return null
        }

        const buffer = getAudioBuffer(name)

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
        category: 'music' | 'sfx',
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

        const buffer = getAudioBuffer(name)

        if (!buffer) {
            console.warn(`Audio buffer not found: ${name}`)
            console.warn('Available buffers:', this.getLoadedAudioBuffers())
            return null
        }

        // Get asset config
        const asset = AUDIO_ASSETS[category][name]
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
            try {
                audio.play()
            } catch (error) {
                console.warn(`Failed to play audio ${name}:`, error)
                return null
            }
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

    /**
     * Get list of loaded audio buffers
     */
    private getLoadedAudioBuffers(): string[] {
        const audioEntries = Object.entries({
            ...AUDIO_ASSETS.music,
            ...AUDIO_ASSETS.sfx,
        })

        return audioEntries
            .filter(([key]) => this.isAudioBufferLoaded(key))
            .map(([key]) => key)
    }

    private getCategoryVolume(category: 'music' | 'sfx'): number {
        switch (category) {
            case 'music':
                return this.musicVolume
            case 'sfx':
                return this.sfxVolume
            default:
                return 1.0
        }
    }

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

    private updateAllVolumes(): void {
        // Update all playing audio
        for (const [key, audio] of this.playingAudio) {
            const [category] = key.split(':')
            const categoryVolume = this.getCategoryVolume(
                category as 'music' | 'sfx',
            )
            audio.setVolume(categoryVolume * this.masterVolume)
        }
    }

    private updateCategoryVolume(category: 'sfx'): void {
        const categoryVolume = this.getCategoryVolume(category)

        for (const [key, audio] of this.playingAudio) {
            if (key.startsWith(`${category}:`)) {
                audio.setVolume(categoryVolume * this.masterVolume)
            }
        }
    }

    setMuted(muted: boolean): void {
        this.audioMuted = muted

        if (muted) {
            for (const audio of this.playingAudio.values()) {
                audio.setVolume(0)
            }
        } else {
            for (const audio of this.playingAudio.values()) {
                audio.setVolume(1)
            }
        }
    }

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

    stopAll(): void {
        for (const audio of this.playingAudio.values()) {
            if (audio.isPlaying) {
                audio.stop()
            }
        }
        this.playingAudio.clear()
        this.currentMusic = null
    }

    getStatus(): {
        initialized: boolean
        currentlyPlaying: number
        musicPlaying: boolean
    } {
        return {
            initialized: this.isInitialized,
            currentlyPlaying: this.playingAudio.size,
            musicPlaying: this.currentMusic?.isPlaying || false,
        }
    }

    /**
     * Test audio playback with a simple sound
     * Useful for debugging audio issues
     */
    public testAudio(): void {
        if (!this.isReady()) {
            console.warn('Audio system not ready for testing')
            return
        }

        console.log('Testing audio playback...')

        // Try to play a test sound
        const testSound = this.playSfx('shoot')
        if (testSound) {
            console.log('Test sound played successfully')
        } else {
            console.warn('Test sound failed to play')
        }
    }

    /**
     * Get detailed audio system status for debugging
     */
    public getDetailedStatus(): {
        initialized: boolean
        contextState: string | null
        audioMuted: boolean
        masterVolume: number
        musicVolume: number
        sfxVolume: number
        currentlyPlaying: number
        musicPlaying: boolean
        loadedBuffers: string[]
        ready: boolean
    } {
        return {
            initialized: this.isInitialized,
            contextState: this.audioContext?.state || null,
            audioMuted: this.audioMuted,
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            currentlyPlaying: this.playingAudio.size,
            musicPlaying: this.currentMusic?.isPlaying || false,
            loadedBuffers: this.getLoadedAudioBuffers(),
            ready: this.isReady(),
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

        this.playingAudio.clear()
        this.isInitialized = false
    }
}
