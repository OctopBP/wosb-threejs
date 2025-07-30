import type { Group } from 'three'
import { AudioLoader, LoadingManager } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { AUDIO_ASSETS } from './config/AudioConfig'
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
            new Promise<void>((resolve, reject) => {
                loader.load(
                    `assets/models/${config.fileName}`,
                    (gltf) => {
                        modelCache[key] = gltf.scene
                        resolve()
                    },
                    undefined,
                    reject,
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
            new Promise<void>((resolve, reject) => {
                loader.load(
                    config.url,
                    (buffer) => {
                        audioCache[key] = buffer
                        resolve()
                    },
                    undefined,
                    reject,
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
