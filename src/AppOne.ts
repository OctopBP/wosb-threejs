import { GUI } from 'lil-gui'
import {
    PCFSoftShadowMap,
    PerspectiveCamera,
    Scene,
    Vector3,
    WebGLRenderer,
} from 'three'
import type { GameStateConfig } from './config/GameStateConfig'
import { defaultGameStateConfig } from './config/GameStateConfig'
import { MainScene, SceneManager, TestScene } from './scenes'

export class AppOne {
    renderer: WebGLRenderer
    scene: Scene
    camera: PerspectiveCamera
    sceneManager: SceneManager
    gui?: GUI

    constructor(
        readonly canvas: HTMLCanvasElement,
        gameStateConfig: GameStateConfig = defaultGameStateConfig,
    ) {
        // Create renderer
        this.renderer = new WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
        })
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = PCFSoftShadowMap
        this.renderer.setClearColor(0x87ceeb, 1) // Sky blue background

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize()
        })

        this.scene = new Scene()
        this.camera = this.createCamera()

        // Create scene manager and add scenes
        this.sceneManager = new SceneManager(
            this.scene,
            this.renderer,
            this.canvas,
            this.camera,
        )

        // Add scenes
        const mainScene = new MainScene(
            this.scene,
            this.renderer,
            this.canvas,
            this.camera,
            gameStateConfig,
        )
        const testScene = new TestScene(
            this.scene,
            this.renderer,
            this.canvas,
            this.camera,
        )

        this.sceneManager.addScene('main', mainScene)
        this.sceneManager.addScene('test', testScene)
    }

    debug(debugOn: boolean = true) {
        if (debugOn && !this.gui) {
            this.gui = new GUI()
            this.createDebugControls()
        } else if (!debugOn && this.gui) {
            this.gui.destroy()
            this.gui = undefined
        }
    }

    run() {
        // Only enable debug in development
        const isDevelopment = import.meta.env.DEV
        this.debug(isDevelopment)

        // Start with the main scene
        this.sceneManager.switchToScene('main')

        this.startRenderLoop()
    }

    private createCamera(): PerspectiveCamera {
        const camera = new PerspectiveCamera(
            50, // field of view
            window.innerWidth / window.innerHeight, // aspect ratio
            0.1, // near plane
            1000, // far plane
        )

        // Position camera
        camera.position.set(0, 12, -10)
        camera.lookAt(new Vector3(0, 0, 0)) // Point camera at the origin where the player ship will be

        return camera
    }

    private createDebugControls() {
        if (!this.gui) return

        // Scene Management controls
        const sceneFolder = this.gui.addFolder('Scene Management')

        // Current scene display
        const sceneStatus = { current: 'main' }
        const sceneStatusController = sceneFolder
            .add(sceneStatus, 'current')
            .name('Current Scene')
        sceneStatusController.disable()

        // Scene switching buttons
        sceneFolder
            .add(
                {
                    switchToMain: () => {
                        if (this.sceneManager.switchToScene('main')) {
                            sceneStatus.current = 'main'
                            sceneStatusController.updateDisplay()
                            console.log(
                                '🎬 Switched to Main Scene (Game World)',
                            )

                            // Recreate debug controls for the new scene
                            this.recreateDebugControls()
                        }
                    },
                },
                'switchToMain',
            )
            .name('Switch to Main Scene')

        sceneFolder
            .add(
                {
                    switchToTest: () => {
                        if (this.sceneManager.switchToScene('test')) {
                            sceneStatus.current = 'test'
                            sceneStatusController.updateDisplay()
                            console.log(
                                '🧪 Switched to Test Scene (Particle Testing)',
                            )

                            // Recreate debug controls for the new scene
                            this.recreateDebugControls()
                        }
                    },
                },
                'switchToTest',
            )
            .name('Switch to Test Scene')

        // Available scenes info
        sceneFolder
            .add(
                {
                    info: () => {
                        const scenes = this.sceneManager.getAvailableScenes()
                        console.log('🎬 Available Scenes:')
                        scenes.forEach((sceneName) => {
                            const current =
                                sceneName ===
                                this.sceneManager.getCurrentSceneName()
                                    ? ' (current)'
                                    : ''
                            console.log(`- ${sceneName}${current}`)
                        })
                    },
                },
                'info',
            )
            .name('Scene Info')

        // Let the current scene add its own debug controls
        this.sceneManager.createDebugControls(this.gui)
    }

    private recreateDebugControls() {
        if (!this.gui) return

        // Close and remove all folders except the Scene Management folder
        const foldersToRemove: any[] = []
        this.gui.folders.forEach((folder: any) => {
            if (folder._title !== 'Scene Management') {
                foldersToRemove.push(folder)
            }
        })

        foldersToRemove.forEach((folder) => {
            folder.destroy()
        })

        // Let the current scene add its debug controls
        this.sceneManager.createDebugControls(this.gui)
    }

    private handleResize() {
        const width = this.canvas.clientWidth
        const height = this.canvas.clientHeight

        this.sceneManager.resize(width, height)
        this.renderer.setSize(width, height)
    }

    private startRenderLoop() {
        const animate = (time: number) => {
            this.sceneManager.update(time)
            this.renderer.render(this.scene, this.camera)
            requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }

    // Method to switch scenes programmatically
    switchToScene(sceneName: string): boolean {
        return this.sceneManager.switchToScene(sceneName)
    }

    // Method to get current scene
    getCurrentScene(): string | null {
        return this.sceneManager.getCurrentSceneName()
    }

    // Method to get available scenes
    getAvailableScenes(): string[] {
        return this.sceneManager.getAvailableScenes()
    }

    // Cleanup method
    dispose() {
        if (this.gui) {
            this.gui.destroy()
        }
        if (this.sceneManager) {
            this.sceneManager.cleanup()
        }
        if (this.renderer) {
            this.renderer.dispose()
        }
    }
}
