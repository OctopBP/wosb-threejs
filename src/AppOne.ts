import * as BABYLON from 'babylonjs'
import { GameWorld } from './GameWorld'

export class AppOne {
    engine: BABYLON.Engine
    scene: BABYLON.Scene
    gameWorld: GameWorld

    constructor(readonly canvas: HTMLCanvasElement) {
        this.engine = new BABYLON.Engine(canvas)
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
        this.debug(true)

        // Initialize the game world
        this.gameWorld.init()

        console.log('Starting game loop...')

        this.engine.runRenderLoop(() => {
            // Update game world with current time
            this.gameWorld.update(performance.now())

            // Render the scene
            this.scene.render()
        })
    }

    private createScene(
        engine: BABYLON.Engine,
        _canvas: HTMLCanvasElement,
    ): BABYLON.Scene {
        // Create a basic Babylon Scene object
        const scene = new BABYLON.Scene(engine)

        // Create and position a free camera
        const camera = new BABYLON.FreeCamera(
            'camera1',
            new BABYLON.Vector3(0, 8, -15),
            scene,
        )

        // Point camera at the origin where the player ship will be
        camera.setTarget(new BABYLON.Vector3(0, 0, 0))

        // Disable default camera controls since we're implementing our own
        // camera.attachControl(canvas, true);

        // Create hemisphere light for general illumination
        const light = new BABYLON.HemisphericLight(
            'light',
            new BABYLON.Vector3(0, 1, 0),
            scene,
        )
        light.intensity = 0.8

        // Create directional light for better depth perception
        const directionalLight = new BABYLON.DirectionalLight(
            'dirLight',
            new BABYLON.Vector3(-1, -1, -1),
            scene,
        )
        directionalLight.position = new BABYLON.Vector3(10, 10, 10)
        directionalLight.intensity = 0.4

        // Create ocean/ground plane
        const ground = BABYLON.MeshBuilder.CreateGround(
            'ocean',
            { width: 50, height: 50 },
            scene,
        )
        const groundMaterial = new BABYLON.StandardMaterial(
            'oceanMaterial',
            scene,
        )
        groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8) // Blue ocean
        groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.2, 0.4)
        ground.material = groundMaterial

        // Add some atmosphere with fog
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2
        scene.fogColor = new BABYLON.Color3(0.7, 0.8, 0.9)
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
