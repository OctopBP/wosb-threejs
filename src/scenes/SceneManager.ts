import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import type { BaseScene } from './BaseScene'

export class SceneManager {
    private scenes: Map<string, BaseScene> = new Map()
    private currentScene: BaseScene | null = null
    private lastTime: number = 0

    constructor(
        private scene: Scene,
        private renderer: WebGLRenderer,
        private canvas: HTMLCanvasElement,
        private camera: PerspectiveCamera,
    ) {}

    addScene(sceneName: string, scene: BaseScene): void {
        this.scenes.set(sceneName, scene)
        console.log(`🎬 Scene "${sceneName}" added to manager`)
    }

    switchToScene(sceneName: string): boolean {
        const newScene = this.scenes.get(sceneName)
        if (!newScene) {
            console.error(`❌ Scene "${sceneName}" not found`)
            return false
        }

        // Cleanup current scene
        if (this.currentScene) {
            console.log(`🧹 Cleaning up scene "${this.currentScene.name}"`)
            this.currentScene.cleanup()
        }

        // Clear the Three.js scene
        this.clearThreeScene()

        // Switch to new scene
        this.currentScene = newScene
        console.log(`🎬 Switching to scene "${sceneName}"`)
        this.currentScene.init()

        return true
    }

    getCurrentScene(): BaseScene | null {
        return this.currentScene
    }

    getCurrentSceneName(): string | null {
        return this.currentScene?.name || null
    }

    getAvailableScenes(): string[] {
        return Array.from(this.scenes.keys())
    }

    update(time: number): void {
        if (!this.currentScene) return

        // Calculate delta time
        const deltaTime =
            this.lastTime === 0 ? 0 : (time - this.lastTime) / 1000
        this.lastTime = time

        // Clamp delta time to prevent large jumps
        const clampedDeltaTime = Math.min(deltaTime, 1 / 30) // Max 30 FPS minimum

        this.currentScene.update(clampedDeltaTime)
    }

    resize(width: number, height: number): void {
        if (this.currentScene) {
            this.currentScene.resize(width, height)
        }
    }

    enableDebug(): void {
        if (this.currentScene?.enableDebug) {
            this.currentScene.enableDebug()
        }
    }

    disableDebug(): void {
        if (this.currentScene?.disableDebug) {
            this.currentScene.disableDebug()
        }
    }

    createDebugControls(gui: any): void {
        if (this.currentScene?.createDebugControls) {
            this.currentScene.createDebugControls(gui)
        }
    }

    cleanup(): void {
        if (this.currentScene) {
            this.currentScene.cleanup()
        }
        this.scenes.clear()
        this.currentScene = null
    }

    private clearThreeScene(): void {
        // Clear all objects from the Three.js scene
        while (this.scene.children.length > 0) {
            const child = this.scene.children[0]
            this.scene.remove(child)

            // Dispose of geometries and materials
            if ('geometry' in child && child.geometry) {
                child.geometry.dispose()
            }
            if ('material' in child && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((material) => material.dispose())
                } else {
                    child.material.dispose()
                }
            }
        }
    }
}
