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
import { GameWorld } from './GameWorld'

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
        this.gameWorld = new GameWorld(
            this.scene,
            this.renderer,
            this.canvas,
            this.camera,
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

    async run() {
        // Only enable debug in development
        const isDevelopment = import.meta.env.DEV
        this.debug(isDevelopment)

        await this.gameWorld.init()

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

        // Create ocean/ground plane
        const groundGeometry = new PlaneGeometry(50, 50)
        const groundMaterial = new MeshLambertMaterial({
            color: new Color(0.2, 0.4, 0.8), // Blue ocean
        })
        const ground = new Mesh(groundGeometry, groundMaterial)
        ground.rotation.x = -Math.PI / 2 // Rotate to be horizontal
        ground.receiveShadow = true
        scene.add(ground)

        // Add fog for atmosphere
        scene.fog = new Fog(new Color(0.7, 0.8, 0.9), 10, 100)

        return scene
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

        // Camera controls
        const cameraFolder = this.gui.addFolder('Camera')
        cameraFolder.add(this.camera.position, 'x', -20, 20, 0.1)
        cameraFolder.add(this.camera.position, 'y', 1, 20, 0.1)
        cameraFolder.add(this.camera.position, 'z', -30, 10, 0.1)

        // Weapon controls
        const weaponFolder = this.gui.addFolder('Weapons')

        // Weapon type toggle
        weaponFolder
            .add(
                {
                    toggleWeaponType: () => {
                        this.gameWorld.togglePlayerWeaponType()
                        console.log(
                            `Weapon switched to: ${
                                this.gameWorld.playerHasAutoTargetingWeapon()
                                    ? 'Auto-Targeting'
                                    : 'Manual'
                            }`,
                        )
                    },
                },
                'toggleWeaponType',
            )
            .name('Toggle Weapon Type')

        // Current weapon status display
        const weaponStatus = { type: 'Manual' }
        const weaponStatusController = weaponFolder
            .add(weaponStatus, 'type')
            .name('Current Weapon')
        weaponStatusController.disable()

        // Update weapon status display
        const updateWeaponStatus = () => {
            weaponStatus.type = this.gameWorld.playerHasAutoTargetingWeapon()
                ? 'Auto-Targeting'
                : 'Manual'
            weaponStatusController.updateDisplay()
        }

        // Update weapon status every frame (simple approach)
        setInterval(updateWeaponStatus, 100)

        // Quick weapon presets
        weaponFolder
            .add(
                {
                    equipManual: () => {
                        this.gameWorld.equipPlayerManualWeapon()
                        console.log('Equipped Manual Weapon')
                    },
                },
                'equipManual',
            )
            .name('Equip Manual Weapon')

        weaponFolder
            .add(
                {
                    equipAutoTargeting: () => {
                        this.gameWorld.equipPlayerAutoTargetingWeapon()
                        console.log('Equipped Auto-Targeting Weapon')
                    },
                },
                'equipAutoTargeting',
            )
            .name('Equip Auto-Targeting')

        weaponFolder
            .add(
                {
                    equipFastAuto: () => {
                        this.gameWorld.equipPlayerAutoTargetingWeapon({
                            damage: 15,
                            fireRate: 2.0,
                            projectileSpeed: 15.0,
                            range: 15.0,
                            detectionRange: 18.0,
                        })
                        console.log('Equipped Fast Auto-Targeting Weapon')
                    },
                },
                'equipFastAuto',
            )
            .name('Equip Fast Auto-Targeting')

        // Auto-targeting debug controls
        weaponFolder
            .add(
                {
                    enableDebug: () => {
                        this.gameWorld.setAutoTargetingDebug(true)
                        console.log(
                            '🎯 Auto-targeting debug enabled - watch console for weapon behavior',
                        )
                    },
                },
                'enableDebug',
            )
            .name('Enable Auto-Targeting Debug')

        weaponFolder
            .add(
                {
                    disableDebug: () => {
                        this.gameWorld.setAutoTargetingDebug(false)
                        console.log('🎯 Auto-targeting debug disabled')
                    },
                },
                'disableDebug',
            )
            .name('Disable Auto-Targeting Debug')

        // Enemy weapon info
        weaponFolder
            .add(
                {
                    enemyWeaponInfo: () => {
                        console.log('🤖 Enemy Auto-Targeting Weapons:')
                        console.log('- Uses unified WeaponConfigPreset system')
                        console.log('- Detection Range: 18 units')
                        console.log('- Firing Range: 16 units')
                        console.log('- Damage: 15 per shot')
                        console.log('- Fire Rate: 0.8 shots/second')
                        console.log('- Only fire when player is in range')
                        console.log(
                            '- Projectiles aim directly at player position',
                        )
                        console.log('- Same codebase as player weapons')
                    },
                },
                'enemyWeaponInfo',
            )
            .name('Enemy Weapon Info')

        weaponFolder
            .add(
                {
                    unifiedSystemInfo: () => {
                        console.log('🔧 Unified Weapon System Benefits:')
                        console.log(
                            '- Single WeaponConfigPreset for all entities',
                        )
                        console.log(
                            '- Consistent behavior between players and enemies',
                        )
                        console.log(
                            '- Simplified configuration and maintenance',
                        )
                        console.log('- Reduced code duplication')
                        console.log('- Same WeaponSystem handles all entities')
                        console.log('- Easy to add new weapon types')
                    },
                },
                'unifiedSystemInfo',
            )
            .name('Unified System Info')

        // Lighting controls
        const lightFolder = this.gui.addFolder('Lighting')
        const hemisphereLight = this.scene.children.find(
            (child): child is HemisphereLight =>
                child instanceof HemisphereLight,
        )
        const directionalLight = this.scene.children.find(
            (child): child is DirectionalLight =>
                child instanceof DirectionalLight,
        )

        if (hemisphereLight) {
            lightFolder
                .add(hemisphereLight, 'intensity', 0, 2, 0.01)
                .name('Hemisphere Intensity')
        }
        if (directionalLight) {
            lightFolder
                .add(directionalLight, 'intensity', 0, 2, 0.01)
                .name('Directional Intensity')
        }

        // Fog controls
        const fogFolder = this.gui.addFolder('Fog')
        if (this.scene.fog instanceof Fog) {
            fogFolder.add(this.scene.fog, 'near', 1, 50, 0.1)
            fogFolder.add(this.scene.fog, 'far', 50, 200, 1)
        }
    }

    private handleResize() {
        const width = this.canvas.clientWidth
        const height = this.canvas.clientHeight

        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(width, height)
    }

    private startRenderLoop() {
        const animate = (time: number) => {
            this.gameWorld.update(time)
            this.renderer.render(this.scene, this.camera)
            requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }

    // Cleanup method
    dispose() {
        if (this.gui) {
            this.gui.destroy()
        }
        if (this.gameWorld) {
            this.gameWorld.cleanup()
        }
        if (this.renderer) {
            this.renderer.dispose()
        }
    }
}
