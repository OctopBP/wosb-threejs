// Tree-shakeable imports - only import what we actually use

import { GUI } from 'lil-gui'
import {
    Color,
    DirectionalLight,
    Fog,
    HemisphereLight,
    Mesh,
    MeshLambertMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    Vector3,
    WebGLRenderer,
} from 'three'
import { type WaterConfig, waterPresets } from './config/WaterConfig'
import { GameWorld, type GameWorldOptions } from './GameWorld'

export class AppOne {
    renderer: WebGLRenderer
    scene: Scene
    camera: PerspectiveCamera
    gameWorld: GameWorld
    gui?: GUI

    constructor(readonly canvas: HTMLCanvasElement) {
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

        this.scene = this.createScene()
        this.camera = this.createCamera()

        // Create game world with water configuration
        const gameWorldOptions: GameWorldOptions = {
            waterConfig: {
                // Start with default settings, can be customized here
                waveSpeed: 1.0,
                waveAmplitude: 0.12,
                textureSize: 45,
            },
        }

        this.gameWorld = new GameWorld(
            this.scene,
            this.renderer,
            this.canvas,
            this.camera,
            gameWorldOptions,
        )
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

        this.gameWorld.init()

        this.startRenderLoop()
    }

    private createScene(): Scene {
        const scene = new Scene()

        // Create hemisphere light for general illumination
        const hemisphereLight = new HemisphereLight(0xffffff, 0x444444, 0.8)
        hemisphereLight.position.set(0, 20, 0)
        scene.add(hemisphereLight)

        // Create directional light for better depth perception and shadows
        const directionalLight = new DirectionalLight(0xffffff, 0.4)
        directionalLight.position.set(10, 10, 10)
        directionalLight.target.position.set(0, 0, 0)
        directionalLight.castShadow = true
        directionalLight.shadow.mapSize.width = 2048
        directionalLight.shadow.mapSize.height = 2048
        directionalLight.shadow.camera.near = 0.5
        directionalLight.shadow.camera.far = 50
        directionalLight.shadow.camera.left = -25
        directionalLight.shadow.camera.right = 25
        directionalLight.shadow.camera.top = 25
        directionalLight.shadow.camera.bottom = -25
        scene.add(directionalLight)

        // Add fog for atmospheric effect
        scene.fog = new Fog(0x87ceeb, 50, 200)

        return scene
    }

    private createCamera(): PerspectiveCamera {
        const camera = new PerspectiveCamera(
            45,
            this.canvas.clientWidth / this.canvas.clientHeight,
            0.1,
            1000,
        )

        // Position camera for isometric-like view of the ship
        camera.position.set(0, 15, 20)
        camera.lookAt(0, 0, 0)

        return camera
    }

    private createDebugControls(): void {
        if (!this.gui) return

        // Get current water config
        const waterConfig = this.gameWorld.getWaterConfig()

        // Water Controls folder
        const waterFolder = this.gui.addFolder('Water Settings')

        // Basic water parameters
        waterFolder
            .add(waterConfig, 'waterLevel', 0, 3, 0.1)
            .onChange((value: number) => {
                this.gameWorld.updateWaterConfig({ waterLevel: value })
            })

        waterFolder
            .add(waterConfig, 'waveSpeed', 0.1, 3, 0.1)
            .onChange((value: number) => {
                this.gameWorld.updateWaterConfig({ waveSpeed: value })
            })

        waterFolder
            .add(waterConfig, 'waveAmplitude', 0.01, 0.5, 0.01)
            .onChange((value: number) => {
                this.gameWorld.updateWaterConfig({ waveAmplitude: value })
            })

        waterFolder
            .add(waterConfig, 'textureSize', 10, 100, 5)
            .onChange((value: number) => {
                this.gameWorld.updateWaterConfig({ textureSize: value })
            })

        waterFolder
            .add(waterConfig, 'foamDepth', 0.01, 0.2, 0.01)
            .onChange((value: number) => {
                this.gameWorld.updateWaterConfig({ foamDepth: value })
            })

        waterFolder
            .add(waterConfig, 'foamThreshold', 0.3, 0.9, 0.05)
            .onChange((value: number) => {
                this.gameWorld.updateWaterConfig({ foamThreshold: value })
            })

        // Water color controls
        const colorParams = {
            colorNear: `#${waterConfig.colorNear.getHexString()}`,
            colorFar: `#${waterConfig.colorFar.getHexString()}`,
        }

        waterFolder
            .addColor(colorParams, 'colorNear')
            .onChange((value: string) => {
                this.gameWorld.updateWaterConfig({
                    colorNear: new Color(value),
                })
            })

        waterFolder
            .addColor(colorParams, 'colorFar')
            .onChange((value: string) => {
                this.gameWorld.updateWaterConfig({ colorFar: new Color(value) })
            })

        // Water presets
        const presetParams = {
            preset: 'default',
        }

        waterFolder
            .add(presetParams, 'preset', [
                'default',
                'calm',
                'rough',
                'tropical',
            ])
            .onChange((value: string) => {
                if (value !== 'default') {
                    const preset =
                        waterPresets[value as keyof typeof waterPresets]
                    this.gameWorld.updateWaterConfig(preset)

                    // Update GUI values to reflect preset
                    waterFolder.controllersRecursive().forEach((controller) => {
                        controller.updateDisplay()
                    })

                    // Update color GUI values
                    colorParams.colorNear = `#${preset.colorNear.getHexString()}`
                    colorParams.colorFar = `#${preset.colorFar.getHexString()}`
                    waterFolder.controllersRecursive().forEach((controller) => {
                        controller.updateDisplay()
                    })
                }
            })

        // Game Controls folder
        const gameFolder = this.gui.addFolder('Game Controls')

        const gameParams = {
            playerHealth: () => this.gameWorld.getPlayerHealth(),
            playerPosition: () => this.gameWorld.getPlayerPosition(),
            entityCount: () => this.gameWorld.getEntityCount(),
            toggleWeaponType: () => this.gameWorld.togglePlayerWeaponType(),
            autoTargetingDebug: false,
        }

        gameFolder.add(gameParams, 'toggleWeaponType').name('Toggle Weapon')
        gameFolder
            .add(gameParams, 'autoTargetingDebug')
            .onChange((value: boolean) => {
                this.gameWorld.setAutoTargetingDebug(value)
            })
            .name('Auto-Target Debug')

        // Performance folder
        const perfFolder = this.gui.addFolder('Performance')

        const performanceParams = {
            wireframe: false,
            shadows: true,
        }

        perfFolder
            .add(performanceParams, 'wireframe')
            .onChange((value: boolean) => {
                this.scene.traverse((child) => {
                    if (child instanceof Mesh && child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach((mat) => {
                                if ('wireframe' in mat) mat.wireframe = value
                            })
                        } else {
                            if ('wireframe' in child.material)
                                child.material.wireframe = value
                        }
                    }
                })
            })

        perfFolder
            .add(performanceParams, 'shadows')
            .onChange((value: boolean) => {
                this.renderer.shadowMap.enabled = value
            })

        waterFolder.open()
    }

    private startRenderLoop(): void {
        const animate = (time: number) => {
            this.gameWorld.update(time)
            this.renderer.render(this.scene, this.camera)
            requestAnimationFrame(animate)
        }

        requestAnimationFrame(animate)
    }

    private handleResize(): void {
        const width = this.canvas.clientWidth
        const height = this.canvas.clientHeight

        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(width, height)
    }
}
