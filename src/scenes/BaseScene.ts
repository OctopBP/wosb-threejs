import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'

export interface BaseScene {
    name: string
    init(): void
    update(deltaTime: number): void
    cleanup(): void
    resize(width: number, height: number): void

    // Optional debug methods
    enableDebug?(): void
    disableDebug?(): void
    createDebugControls?(gui: any): void
}

export abstract class AbstractScene implements BaseScene {
    abstract name: string

    constructor(
        protected scene: Scene,
        protected renderer: WebGLRenderer,
        protected canvas: HTMLCanvasElement,
        protected camera: PerspectiveCamera,
    ) {}

    abstract init(): void
    abstract update(deltaTime: number): void
    abstract cleanup(): void

    resize(width: number, height: number): void {
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(width, height)
    }

    enableDebug?(): void
    disableDebug?(): void
    createDebugControls?(gui: any): void
}
