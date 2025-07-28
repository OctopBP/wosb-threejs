import { audioAssets } from './config/AudioConfig'
import type { AudioAsset, AudioAssets } from './systems/AudioSystem'

interface AudioPreloadProgress {
    loaded: number
    total: number
    percentage: number
}

export class AudioPreloader {
    private loadedBuffers = new Map<string, AudioBuffer>()
    private audioContext: AudioContext | null = null
    private onProgress?: (progress: AudioPreloadProgress) => void

    constructor(onProgress?: (progress: AudioPreloadProgress) => void) {
        this.onProgress = onProgress
    }

    /**
     * Preload all audio assets without requiring user interaction
     * This loads the audio files as ArrayBuffers that can be converted to AudioBuffers later
     */
    async preloadAudioAssets(): Promise<Map<string, AudioBuffer>> {
        console.log('🎵 Starting audio assets preload...')

        const allAssets = this.collectAllAssets(audioAssets)
        const total = allAssets.length
        let loaded = 0

        const reportProgress = () => {
            const progress = {
                loaded,
                total,
                percentage:
                    total > 0 ? Math.round((loaded / total) * 100) : 100,
            }
            this.onProgress?.(progress)
        }

        // Create a temporary AudioContext for decoding
        this.audioContext = new (
            window.AudioContext || (window as any).webkitAudioContext
        )()

        const loadPromises = allAssets.map(async ({ key, asset }) => {
            try {
                const buffer = await this.loadSingleAsset(asset)
                this.loadedBuffers.set(key, buffer)
                loaded++
                reportProgress()
                console.log(`✅ Loaded audio: ${key}`)
            } catch (error) {
                console.error(`❌ Failed to load audio: ${key}`, error)
                loaded++
                reportProgress()
            }
        })

        await Promise.all(loadPromises)

        console.log(
            `🎵 Audio preload complete: ${this.loadedBuffers.size}/${total} assets loaded`,
        )
        return this.loadedBuffers
    }

    private collectAllAssets(
        assets: AudioAssets,
    ): Array<{ key: string; asset: AudioAsset }> {
        const allAssets: Array<{ key: string; asset: AudioAsset }> = []

        for (const [category, categoryAssets] of Object.entries(assets)) {
            for (const [name, asset] of Object.entries(categoryAssets)) {
                const key = `${category}:${name}`
                allAssets.push({ key, asset: asset as AudioAsset })
            }
        }

        return allAssets
    }

    private async loadSingleAsset(asset: AudioAsset): Promise<AudioBuffer> {
        // Load the audio file as ArrayBuffer
        const response = await fetch(asset.url)
        if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()

        // Decode the ArrayBuffer to AudioBuffer
        if (!this.audioContext) {
            throw new Error('AudioContext not available')
        }

        return await this.audioContext.decodeAudioData(arrayBuffer)
    }

    /**
     * Get the preloaded audio buffers
     */
    getLoadedBuffers(): Map<string, AudioBuffer> {
        return this.loadedBuffers
    }

    /**
     * Clean up the temporary AudioContext used for preloading
     */
    cleanup(): void {
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close()
        }
        this.audioContext = null
    }
}
