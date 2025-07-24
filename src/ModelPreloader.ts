import type { Group } from 'three'
import { LoadingManager } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { ModelType } from './config/ModelConfig'
import { MODEL_CONFIGS } from './config/ModelConfig'

const modelCache: Partial<Record<ModelType, Group>> = {}

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

export function getModelClone(modelType: ModelType): Group | null {
    const cachedModel = modelCache[modelType]
    if (!cachedModel) {
        console.warn(`Model '${modelType}' not found in cache`)
        return null
    }
    return cachedModel.clone()
}

/**
 * Get a model clone specifically for collision detection purposes
 * This function is separate from the main getModelClone to avoid
 * interfering with the rendering system
 */
export function getCollisionModelClone(modelType: ModelType): Group | null {
    const cachedModel = modelCache[modelType]
    if (!cachedModel) {
        console.warn(`Collision model '${modelType}' not found in cache`)
        return null
    }
    return cachedModel.clone()
}

/**
 * Check if a model type is available in the cache
 */
export function isModelLoaded(modelType: ModelType): boolean {
    return !!modelCache[modelType]
}

/**
 * Get available model types that are currently loaded
 */
export function getLoadedModelTypes(): ModelType[] {
    return Object.keys(modelCache) as ModelType[]
}
