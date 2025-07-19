import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import type { GameStateConfig } from '../config/GameStateConfig'
import { defaultGameStateConfig } from '../config/GameStateConfig'
import { GameWorld } from '../GameWorld'
import { AbstractScene } from './BaseScene'

export class MainScene extends AbstractScene {
    name = 'main'
    private gameWorld: GameWorld

    constructor(
        scene: Scene,
        renderer: WebGLRenderer,
        canvas: HTMLCanvasElement,
        camera: PerspectiveCamera,
        gameStateConfig: GameStateConfig = defaultGameStateConfig,
    ) {
        super(scene, renderer, canvas, camera)
        this.gameWorld = new GameWorld(
            this.scene,
            this.renderer,
            this.canvas,
            this.camera,
            gameStateConfig,
        )
    }

    init(): void {
        console.log('🎮 Initializing Main Scene (Game World)')
        this.gameWorld.init()
    }

    update(deltaTime: number): void {
        // Convert deltaTime back to timestamp for GameWorld
        const currentTime = performance.now()
        this.gameWorld.update(currentTime)
    }

    cleanup(): void {
        console.log('🧹 Cleaning up Main Scene')
        this.gameWorld.cleanup()
    }

    enableDebug(): void {
        // Enable debug mode for the game world
        this.gameWorld.setDebugMode(true)
    }

    disableDebug(): void {
        // Disable debug mode for the game world
        this.gameWorld.setDebugMode(false)
    }

    createDebugControls(gui: any): void {
        if (!gui) return

        // Camera controls
        const cameraFolder = gui.addFolder('Camera')

        // Camera state transitions
        cameraFolder
            .add(
                {
                    playerFocus: () => {
                        this.gameWorld.transitionToCameraState('playerFocus')
                        console.log('🎥 Camera: Player Focus')
                    },
                },
                'playerFocus',
            )
            .name('Player Focus')

        cameraFolder
            .add(
                {
                    enemyFocus: () => {
                        this.gameWorld.transitionToCameraState('enemyFocus')
                        console.log('🎥 Camera: Enemy Focus')
                    },
                },
                'enemyFocus',
            )
            .name('Enemy Focus')

        cameraFolder
            .add(
                {
                    bossPreview: () => {
                        this.gameWorld.transitionToCameraState('bossPreview')
                        console.log('🎥 Camera: Boss Preview')
                    },
                },
                'bossPreview',
            )
            .name('Boss Preview')

        // Screen shake presets
        cameraFolder
            .add(
                {
                    lightShake: () => {
                        this.gameWorld.triggerScreenShakePreset('light')
                        console.log('📳 Screen Shake: Light')
                    },
                },
                'lightShake',
            )
            .name('Light Shake')

        cameraFolder
            .add(
                {
                    mediumShake: () => {
                        this.gameWorld.triggerScreenShakePreset('medium')
                        console.log('📳 Screen Shake: Medium')
                    },
                },
                'mediumShake',
            )
            .name('Medium Shake')

        // Zoom presets
        cameraFolder
            .add(
                {
                    closeZoom: () => {
                        this.gameWorld.triggerZoomPreset('close')
                        console.log('🔍 Zoom: Close')
                    },
                },
                'closeZoom',
            )
            .name('Close Zoom')

        // Weapon controls
        const weaponFolder = gui.addFolder('Weapon Controls')

        weaponFolder
            .add(
                {
                    equipStandard: () => {
                        this.gameWorld.equipPlayerWeapon()
                        console.log('Equipped Standard Auto-Targeting Weapon')
                    },
                },
                'equipStandard',
            )
            .name('Equip Standard Weapon')

        weaponFolder
            .add(
                {
                    enableDebug: () => {
                        this.gameWorld.setAutoTargetingDebug(true)
                        console.log('🎯 Auto-targeting debug enabled')
                    },
                },
                'enableDebug',
            )
            .name('Enable Auto-Targeting Debug')

        // Debug Visualization controls
        const debugFolder = gui.addFolder('Debug Visualization')

        const debugState = { enabled: false }
        debugFolder
            .add(debugState, 'enabled')
            .name('Enable Debug Mode')
            .onChange((enabled: boolean) => {
                this.gameWorld.setDebugMode(enabled)
                console.log(
                    `🔍 Debug Mode: ${enabled ? 'Enabled' : 'Disabled'}`,
                )
            })

        const shootingPointsState = { enabled: false }
        debugFolder
            .add(shootingPointsState, 'enabled')
            .name('Show Shooting Points')
            .onChange((enabled: boolean) => {
                this.gameWorld.toggleDebugShootingPoints(enabled)
                console.log(
                    `🎯 Shooting Points: ${enabled ? 'Visible' : 'Hidden'}`,
                )
            })

        const collisionShapesState = { enabled: false }
        debugFolder
            .add(collisionShapesState, 'enabled')
            .name('Show Collision Shapes')
            .onChange((enabled: boolean) => {
                this.gameWorld.toggleDebugCollisionShapes(enabled)
                console.log(
                    `🟢 Collision Shapes: ${enabled ? 'Visible' : 'Hidden'}`,
                )
            })
    }

    // Expose GameWorld methods for external access
    getGameWorld(): GameWorld {
        return this.gameWorld
    }
}
