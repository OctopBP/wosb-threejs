// Tree-shakeable imports - only import what we actually use
import {
    Color3,
    DirectionalLight,
    Engine,
    FreeCamera,
    HemisphericLight,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Vector3,
} from '@babylonjs/core'
import { GameWorld } from './GameWorld'
import '@babylonjs/inspector'

export class AppOne {
    engine: Engine
    scene: Scene
    gameWorld: GameWorld

    constructor(readonly canvas: HTMLCanvasElement) {
        this.engine = new Engine(canvas)
        window.addEventListener('resize', () => {
            this.engine.resize()
        })

        this.scene = this.createScene(this.engine, this.canvas)
        this.gameWorld = new GameWorld(this.scene, this.canvas)
    }

    debug(debugOn: boolean = true) {
        if (debugOn) {
            this.scene.debugLayer.show({ overlay: true })
        } else {
            this.scene.debugLayer.hide()
        }
    }

    run() {
        // Only enable debug in development
        const isDevelopment = import.meta.env.DEV
        this.debug(isDevelopment)

        this.gameWorld.init()

        this.engine.runRenderLoop(() => {
            this.gameWorld.update(performance.now())
            this.scene.render()
        })
    }

    private createScene(engine: Engine, _canvas: HTMLCanvasElement): Scene {
        // Create a basic Babylon Scene object
        const scene = new Scene(engine)

        // Create and position a free camera
        const camera = new FreeCamera('camera1', new Vector3(0, 8, -15), scene)

        // Point camera at the origin where the player ship will be
        camera.setTarget(new Vector3(0, 0, 0))

        // Disable default camera controls since we're implementing our own
        // camera.attachControl(canvas, true);

        // Create hemisphere light for general illumination
        const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
        light.intensity = 0.8

        // Create directional light for better depth perception
        const directionalLight = new DirectionalLight(
            'dirLight',
            new Vector3(-1, -1, -1),
            scene,
        )
        directionalLight.position = new Vector3(10, 10, 10)
        directionalLight.intensity = 0.4

        // Create ocean/ground plane
        const ground = MeshBuilder.CreateGround(
            'ocean',
            { width: 50, height: 50 },
            scene,
        )
        const groundMaterial = new StandardMaterial('oceanMaterial', scene)
        groundMaterial.diffuseColor = new Color3(0.2, 0.4, 0.8) // Blue ocean
        groundMaterial.specularColor = new Color3(0.1, 0.2, 0.4)
        ground.material = groundMaterial

        // Add some atmosphere with fog
        scene.fogMode = Scene.FOGMODE_EXP2
        scene.fogColor = new Color3(0.7, 0.8, 0.9)
        scene.fogDensity = 0.01

        return scene
    }

    // Cleanup method
    dispose() {
        if (this.gameWorld) {
            this.gameWorld.cleanup()
        }
        if (this.scene) {
            this.scene.dispose()
        }
        if (this.engine) {
            this.engine.dispose()
        }
    }
}
