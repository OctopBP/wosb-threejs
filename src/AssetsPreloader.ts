import type { Group } from 'three'
import { AudioLoader, LoadingManager } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { AUDIO_ASSETS, audioFormats } from './config/AudioConfig'
import type { ModelType } from './config/ModelConfig'
import { MODEL_CONFIGS } from './config/ModelConfig'

const modelCache: Partial<Record<ModelType, Group>> = {}
const audioCache: Partial<Record<string, AudioBuffer>> = {}

export function preloadModels(): Promise<void> {
    const manager = new LoadingManager()
    const loader = new GLTFLoader(manager)

    const modelEntries = Object.entries(MODEL_CONFIGS).filter(
        ([, config]) => config.kind === 'model',
    ) as [ModelType, { kind: 'model'; fileName: string; scale: number }][]

    const promises = modelEntries.map(
        ([key, config]) =>
            new Promise<void>((resolve) => {
                loader.load(
                    `assets/models/${config.fileName}`,
                    (gltf) => {
                        modelCache[key] = gltf.scene
                        resolve()
                    },
                    undefined,
                    (error) => {
                        console.warn(
                            `Model preload failed for ${config.fileName}:`,
                            error,
                        )
                        // Resolve to avoid blocking game startup
                        resolve()
                    },
                )
            }),
    )

    return Promise.all(promises).then(() => undefined)
}

export function preloadAudio(): Promise<void> {
    const manager = new LoadingManager()
    const loader = new AudioLoader(manager)

    const audioEntries = Object.entries({
        ...AUDIO_ASSETS.music,
        ...AUDIO_ASSETS.sfx,
    })

    const promises = audioEntries.map(
        ([key, config]) =>
            new Promise<void>((resolve) => {
                loader.load(
                    config.url,
                    (buffer) => {
                        audioCache[key] = buffer
                        resolve()
                    },
                    undefined,
                    (error) => {
                        console.warn(
                            `Audio preload failed for ${key} (${config.url}):`,
                            error,
                        )
                        // Resolve to avoid blocking game startup
                        resolve()
                    },
                )
            }),
    )

    return Promise.all(promises).then(() => undefined)
}

export function getModelClone(key: ModelType): Group | undefined {
    const cached = modelCache[key]
    return cached ? cached.clone(true) : undefined
}

export function getAudioBuffer(key: string): AudioBuffer | undefined {
    return audioCache[key]
}

/**
 * Lazily load an audio buffer by name (from AUDIO_ASSETS music/sfx)
 * Returns the buffer if loaded successfully, or undefined on failure.
 */
export async function ensureAudioBuffer(
    key: string,
): Promise<AudioBuffer | undefined> {
    if (audioCache[key]) {
        return audioCache[key]
    }

    // Determine URL from AUDIO_ASSETS
    const asset = (AUDIO_ASSETS.music as Record<string, { url: string }>)[key]
        ? (AUDIO_ASSETS.music as Record<string, { url: string }>)[key]
        : (AUDIO_ASSETS.sfx as Record<string, { url: string }>)[key]

    if (!asset) {
        console.warn(`ensureAudioBuffer: Unknown audio key: ${key}`)
        return undefined
    }

    // Determine supported formats
    const audioEl = document.createElement('audio')
    const supportPriority = audioFormats.filter((fmt) => {
        switch (fmt) {
            case 'mp3':
                return !!audioEl.canPlayType('audio/mpeg')
            case 'ogg':
                return !!audioEl.canPlayType('audio/ogg; codecs="vorbis"')
            case 'wav':
                return !!audioEl.canPlayType('audio/wav; codecs="1"')
            default:
                return false
        }
    })

    // Build base URL without extension
    const baseUrl = asset.url.replace(/\.(mp3|ogg|wav)$/i, '')

    // Try to load in order of supported formats
    for (const ext of supportPriority) {
        const url = `${baseUrl}.${ext}`
        try {
            const buffer = await new Promise<AudioBuffer>((resolve, reject) => {
                const loader = new AudioLoader()
                loader.load(url, resolve, undefined, reject)
            })
            audioCache[key] = buffer
            return buffer
        } catch (err) {}
    }

    // As a last resort, try the original URL (even if format seems unsupported)
    try {
        const buffer = await new Promise<AudioBuffer>((resolve, reject) => {
            const loader = new AudioLoader()
            loader.load(asset.url, resolve, undefined, reject)
        })
        audioCache[key] = buffer
        return buffer
    } catch {}

    console.warn(
        `Failed to load audio for ${key}. Consider providing mp3/wav alternatives for iOS.`,
    )
    return undefined
}

export function preloadLocalization(): Promise<void> {
    const languages = ['en', 'ru', 'de', 'es', 'fr', 'pt', 'pl', 'hi']

    const promises = languages.map(
        (lang) =>
            new Promise<void>((resolve) => {
                fetch(`assets/localization/${lang}.json`)
                    .then((response) => {
                        if (response.ok) {
                            resolve()
                        } else {
                            console.warn(
                                `Failed to preload ${lang} localization`,
                            )
                            resolve()
                        }
                    })
                    .catch((error) => {
                        console.warn(
                            `Failed to preload ${lang} localization:`,
                            error,
                        )
                        resolve()
                    })
            }),
    )

    return Promise.all(promises).then(() => undefined)
}
