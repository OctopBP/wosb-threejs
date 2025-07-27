// Tree-shakeable imports - only import what we actually use

import { GUI } from 'lil-gui'
import {
    Color,
    CubeTextureLoader,
    DepthFormat,
    DepthTexture,
    DirectionalLight,
    Fog,
    HemisphereLight,
    Mesh,
    MeshBasicMaterial,
    NormalBlending,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    ShaderMaterial,
    TextureLoader,
    UniformsLib,
    UniformsUtils,
    UnsignedShortType,
    Vector2,
    Vector3,
    WebGLRenderer,
    WebGLRenderTarget,
} from 'three'
import { GameWorld } from './GameWorld'
import waterFragmentShader from './shaders/water.frag?raw'
import waterVertexShader from './shaders/water.vert?raw'

export class AppOne {
    renderer: WebGLRenderer
    scene: Scene
    camera: PerspectiveCamera
    gameWorld: GameWorld
    gui?: GUI

    waterMesh?: Mesh
    waterMaterial?: ShaderMaterial

    // Depth texture properties
    private depthRenderTarget!: WebGLRenderTarget
    private depthTexture!: DepthTexture

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

        this.camera = this.createCamera()
        this.scene = this.createScene()

        // Initialize depth texture for water edge detection
        this.setupDepthTexture()

        this.gameWorld = new GameWorld(
            this.scene,
            this.renderer,
            this.canvas,
            this.camera,
        )
        this.createWater()

        window.addEventListener('resize', () => {
            this.handleResize()
        })
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
        const hemisphereLight = new HemisphereLight(0xffffff, 0x304480, 0.75)
        hemisphereLight.position.set(0, 20, 0)
        scene.add(hemisphereLight)

        // Create directional light for better depth perception and shadows
        const directionalLight = new DirectionalLight(0xffffff, 2.5)
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

        // Add fog for atmosphere
        // scene.fog = new Fog(new Color(0.7, 0.8, 0.9), 25, 45)

        return scene
    }

    private createWater() {
        const waterGeometry = new PlaneGeometry(150, 150, 512, 512)
        const skyTexturePath = 'assets/textures/sky.png'
        const envMap = new CubeTextureLoader().load([
            skyTexturePath, // px
            skyTexturePath, // nx
            skyTexturePath, // py
            skyTexturePath, // ny
            skyTexturePath, // pz
            skyTexturePath, // nz
        ])
        const foamTexture = new TextureLoader().load('assets/textures/foam.jpg')
        const waterUniforms = {
            uTime: { value: 0 },
            uWavesAmplitude: { value: 0.1 },
            uWavesSpeed: { value: 0.15 },
            uWavesFrequency: { value: 0.08 },
            uWavesPersistence: { value: 0.6 },
            uWavesLacunarity: { value: 2.0 },
            uWavesIterations: { value: 6.0 },
            uOpacity: { value: 0.8 },
            uTroughColor: { value: new Color(0.1, 0.2, 0.4) },
            uSurfaceColor: { value: new Color(0.2, 0.4, 0.8) },
            uPeakColor: { value: new Color(0.8, 0.9, 1.0) },
            uPeakThreshold: { value: 0.4 },
            uPeakTransition: { value: 0.2 },
            uTroughThreshold: { value: -1.5 },
            uTroughTransition: { value: 0.75 },
            uFresnelScale: { value: 0.7 },
            uFresnelPower: { value: 0.5 },
            uEnvironmentMap: { value: envMap },
            bwTexture: {
                value: this.gameWorld.getProceduralTextureSystem().getTexture(),
            },
            foamTexture: { value: foamTexture },
            // Depth texture uniforms for edge detection
            uDepthTexture: { value: this.depthTexture },
            uResolution: {
                value: new Vector2(
                    this.canvas.clientWidth,
                    this.canvas.clientHeight,
                ),
            },
            uCameraNear: { value: this.camera.near },
            uCameraFar: { value: this.camera.far },
            uEdgeThickness: { value: 0.0005 },
            uEdgeIntensity: { value: 10 },
            uDebugDepth: { value: 0.0 },
            uHideShips: { value: 0.0 },
        }
        const waterMaterial = new ShaderMaterial({
            vertexShader: waterVertexShader,
            fragmentShader: waterFragmentShader,
            uniforms: UniformsUtils.merge([UniformsLib['fog'], waterUniforms]),
            blending: NormalBlending,
            transparent: true,
            depthWrite: true,
            depthTest: true,
            fog: true,
        })
        const water = new Mesh(waterGeometry, waterMaterial)
        water.rotation.x = -Math.PI / 2
        water.position.set(0, 0, 35)
        water.receiveShadow = true
        water.name = 'Water'
        water.renderOrder = 1
        this.scene.add(water)
        this.waterMesh = water
        this.waterMaterial = waterMaterial
    }

    private setupDepthTexture() {
        const width = this.canvas.clientWidth
        const height = this.canvas.clientHeight

        // Create depth texture
        this.depthTexture = new DepthTexture(width, height)
        this.depthTexture.format = DepthFormat
        this.depthTexture.type = UnsignedShortType

        // Create render target for depth
        this.depthRenderTarget = new WebGLRenderTarget(width, height, {
            depthTexture: this.depthTexture,
            depthBuffer: true,
            stencilBuffer: false,
        })
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

        // Camera state transitions
        cameraFolder
            .add(
                {
                    playerFocus: () => {
                        this.gameWorld.transitionToCameraState('playerFocus')
                        console.log('🎥 Camera: Player Focus')
                    },
                    enemyFocus: () => {
                        this.gameWorld.transitionToCameraState('enemyFocus')
                        console.log('🎥 Camera: Enemy Focus')
                    },
                    bossPreview: () => {
                        this.gameWorld.transitionToCameraState('bossPreview')
                        console.log('🎥 Camera: Boss Preview')
                    },
                    cinematic: () => {
                        this.gameWorld.transitionToCameraState('cinematic')
                        console.log('🎥 Camera: Cinematic')
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

        cameraFolder
            .add(
                {
                    cinematic: () => {
                        this.gameWorld.transitionToCameraState('cinematic')
                        console.log('🎥 Camera: Cinematic')
                    },
                },
                'cinematic',
            )
            .name('Cinematic')

        // Screen shake presets
        cameraFolder
            .add(
                {
                    lightShake: () => {
                        this.gameWorld.triggerScreenShakePreset('light')
                        console.log('📳 Screen Shake: Light')
                    },
                    mediumShake: () => {
                        this.gameWorld.triggerScreenShakePreset('medium')
                        console.log('📳 Screen Shake: Medium')
                    },
                    heavyShake: () => {
                        this.gameWorld.triggerScreenShakePreset('heavy')
                        console.log('📳 Screen Shake: Heavy')
                    },
                    bossShake: () => {
                        this.gameWorld.triggerScreenShakePreset('boss')
                        console.log('📳 Screen Shake: Boss')
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

        cameraFolder
            .add(
                {
                    heavyShake: () => {
                        this.gameWorld.triggerScreenShakePreset('heavy')
                        console.log('📳 Screen Shake: Heavy')
                    },
                },
                'heavyShake',
            )
            .name('Heavy Shake')

        cameraFolder
            .add(
                {
                    bossShake: () => {
                        this.gameWorld.triggerScreenShakePreset('boss')
                        console.log('📳 Screen Shake: Boss')
                    },
                },
                'bossShake',
            )
            .name('Boss Shake')

        // Zoom presets
        cameraFolder
            .add(
                {
                    closeZoom: () => {
                        this.gameWorld.triggerZoomPreset('close')
                        console.log('🔍 Zoom: Close')
                    },
                    mediumZoom: () => {
                        this.gameWorld.triggerZoomPreset('medium')
                        console.log('🔍 Zoom: Medium')
                    },
                    farZoom: () => {
                        this.gameWorld.triggerZoomPreset('far')
                        console.log('🔍 Zoom: Far')
                    },
                    cinematicZoom: () => {
                        this.gameWorld.triggerZoomPreset('cinematic')
                        console.log('🔍 Zoom: Cinematic')
                    },
                },
                'closeZoom',
            )
            .name('Close Zoom')

        cameraFolder
            .add(
                {
                    mediumZoom: () => {
                        this.gameWorld.triggerZoomPreset('medium')
                        console.log('🔍 Zoom: Medium')
                    },
                },
                'mediumZoom',
            )
            .name('Medium Zoom')

        cameraFolder
            .add(
                {
                    farZoom: () => {
                        this.gameWorld.triggerZoomPreset('far')
                        console.log('🔍 Zoom: Far')
                    },
                },
                'farZoom',
            )
            .name('Far Zoom')

        cameraFolder
            .add(
                {
                    cinematicZoom: () => {
                        this.gameWorld.triggerZoomPreset('cinematic')
                        console.log('🔍 Zoom: Cinematic')
                    },
                },
                'cinematicZoom',
            )
            .name('Cinematic Zoom')

        // Current camera state display
        const cameraStatus = { state: 'Player Focus' }
        const cameraStatusController = cameraFolder
            .add(cameraStatus, 'state')
            .name('Current State')
        cameraStatusController.disable()

        // Update camera status display
        const updateCameraStatus = () => {
            const currentState = this.gameWorld.getCurrentCameraState()
            if (currentState) {
                cameraStatus.state =
                    currentState === 'playerFocus'
                        ? 'Player Focus'
                        : currentState === 'enemyFocus'
                          ? 'Enemy Focus'
                          : currentState === 'bossPreview'
                            ? 'Boss Preview'
                            : currentState === 'cinematic'
                              ? 'Cinematic'
                              : currentState
            }
            cameraStatusController.updateDisplay()
        }

        // Update camera status every frame
        setInterval(updateCameraStatus, 100)

        // Debug Visualization controls
        const debugFolder = this.gui.addFolder('Debug Visualization')

        // Master debug toggle
        const debugState = { enabled: false }
        const debugController = debugFolder
            .add(debugState, 'enabled')
            .name('Enable Debug Mode')
            .onChange((enabled: boolean) => {
                this.gameWorld.setDebugMode(enabled)
                console.log(
                    `🔍 Debug Mode: ${enabled ? 'Enabled' : 'Disabled'}`,
                )
            })

        // Individual debug toggles
        const shootingPointsState = { enabled: false }
        const shootingPointsController = debugFolder
            .add(shootingPointsState, 'enabled')
            .name('Show Shooting Points')
            .onChange((enabled: boolean) => {
                this.gameWorld.toggleDebugShootingPoints(enabled)
                console.log(
                    `🎯 Shooting Points: ${enabled ? 'Visible' : 'Hidden'}`,
                )
            })

        const collisionShapesState = { enabled: false }
        const collisionShapesController = debugFolder
            .add(collisionShapesState, 'enabled')
            .name('Show Collision Shapes')
            .onChange((enabled: boolean) => {
                this.gameWorld.toggleDebugCollisionShapes(enabled)
                console.log(
                    `🟢 Collision Shapes: ${enabled ? 'Visible' : 'Hidden'}`,
                )
            })

        const weaponRangeState = { enabled: false }
        const weaponRangeController = debugFolder
            .add(weaponRangeState, 'enabled')
            .name('Show Weapon Range')
            .onChange((enabled: boolean) => {
                this.gameWorld.toggleDebugWeaponRange(enabled)
                console.log(
                    `🔵 Weapon Range: ${enabled ? 'Visible' : 'Hidden'}`,
                )
            })

        const velocityVectorsState = { enabled: false }
        const velocityVectorsController = debugFolder
            .add(velocityVectorsState, 'enabled')
            .name('Show Velocity Vectors')
            .onChange((enabled: boolean) => {
                this.gameWorld.toggleDebugVelocityVectors(enabled)
                console.log(
                    `🟡 Velocity Vectors: ${enabled ? 'Visible' : 'Hidden'}`,
                )
            })

        // Quick toggle all debug features
        debugFolder
            .add(
                {
                    enableAll: () => {
                        debugState.enabled = true
                        shootingPointsState.enabled = true
                        collisionShapesState.enabled = true
                        weaponRangeState.enabled = true
                        velocityVectorsState.enabled = true

                        this.gameWorld.setDebugMode(true)
                        this.gameWorld.toggleDebugShootingPoints(true)
                        this.gameWorld.toggleDebugCollisionShapes(true)
                        this.gameWorld.toggleDebugWeaponRange(true)
                        this.gameWorld.toggleDebugVelocityVectors(true)

                        // Update UI to reflect changes
                        debugController.updateDisplay()
                        shootingPointsController.updateDisplay()
                        collisionShapesController.updateDisplay()
                        weaponRangeController.updateDisplay()
                        velocityVectorsController.updateDisplay()
                        console.log('🔍 All Debug Features Enabled')
                    },
                },
                'enableAll',
            )
            .name('Enable All Debug')

        debugFolder
            .add(
                {
                    disableAll: () => {
                        debugState.enabled = false
                        shootingPointsState.enabled = false
                        collisionShapesState.enabled = false
                        weaponRangeState.enabled = false
                        velocityVectorsState.enabled = false

                        this.gameWorld.setDebugMode(false)
                        this.gameWorld.toggleDebugShootingPoints(false)
                        this.gameWorld.toggleDebugCollisionShapes(false)
                        this.gameWorld.toggleDebugWeaponRange(false)
                        this.gameWorld.toggleDebugVelocityVectors(false)

                        // Update UI to reflect changes
                        debugController.updateDisplay()
                        shootingPointsController.updateDisplay()
                        collisionShapesController.updateDisplay()
                        weaponRangeController.updateDisplay()
                        velocityVectorsController.updateDisplay()
                        console.log('🔍 All Debug Features Disabled')
                    },
                },
                'disableAll',
            )
            .name('Disable All Debug')

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
                .add(directionalLight, 'intensity', 0, 5, 0.01)
                .name('Directional Intensity')
        }

        // Fog controls
        const fogFolder = this.gui.addFolder('Fog')
        if (this.scene.fog instanceof Fog) {
            fogFolder.add(this.scene.fog, 'near', 1, 50, 0.1)
            fogFolder.add(this.scene.fog, 'far', 50, 200, 1)
        }

        this.createWaterFolderWithRetry()
    }

    private createWaterFolderWithRetry(retries = 5, delay = 200) {
        if (!this.gui) return
        // Remove existing Water folder if it exists (prevents duplicates)
        const existing = this.gui.folders.find((f) => f._title === 'Water')
        if (existing) {
            existing.destroy()
        }
        if (this.waterMaterial?.uniforms) {
            this.createWaterFolder()
        } else if (retries > 0) {
            console.warn('Water uniforms not ready, retrying...')
            setTimeout(
                () => this.createWaterFolderWithRetry(retries - 1, delay),
                delay,
            )
        } else {
            const waterFolder = this.gui.addFolder('Water')
            waterFolder
                .add({ error: 'Water uniforms not ready' }, 'error')
                .name('Error')
            console.error('Water uniforms not available after retries.')
        }
    }

    private createWaterFolder() {
        if (!this.gui) return
        const waterFolder = this.gui.addFolder('Water')
        const uniforms = this.waterMaterial?.uniforms
        if (uniforms) {
            // Numeric uniforms
            waterFolder
                .add(uniforms.uWavesAmplitude, 'value', 0, 5, 0.01)
                .name('Waves Amplitude')
            waterFolder
                .add(uniforms.uWavesSpeed, 'value', 0, 2, 0.01)
                .name('Waves Speed')
            waterFolder
                .add(uniforms.uWavesFrequency, 'value', 0, 1, 0.001)
                .name('Waves Frequency')
            waterFolder
                .add(uniforms.uWavesPersistence, 'value', 0, 1, 0.01)
                .name('Waves Persistence')
            waterFolder
                .add(uniforms.uWavesLacunarity, 'value', 1, 4, 0.01)
                .name('Waves Lacunarity')
            waterFolder
                .add(uniforms.uWavesIterations, 'value', 1, 8, 1)
                .name('Waves Iterations')
            waterFolder
                .add(uniforms.uOpacity, 'value', 0, 1, 0.01)
                .name('Opacity')
            waterFolder
                .add(uniforms.uPeakThreshold, 'value', 0, 2, 0.01)
                .name('Peak Threshold')
            waterFolder
                .add(uniforms.uPeakTransition, 'value', 0, 1, 0.01)
                .name('Peak Transition')
            waterFolder
                .add(uniforms.uTroughThreshold, 'value', -2, 0, 0.01)
                .name('Trough Threshold')
            waterFolder
                .add(uniforms.uTroughTransition, 'value', 0, 1, 0.01)
                .name('Trough Transition')
            waterFolder
                .add(uniforms.uFresnelScale, 'value', 0, 3, 0.01)
                .name('Fresnel Scale')
            waterFolder
                .add(uniforms.uFresnelPower, 'value', 0, 5, 0.01)
                .name('Fresnel Power')

            // Edge detection controls
            waterFolder
                .add(uniforms.uEdgeThickness, 'value', 0, 0.1, 0.001)
                .name('Edge Thickness')
            waterFolder
                .add(uniforms.uEdgeIntensity, 'value', 0, 15, 0.01)
                .name('Edge Intensity')

            // Debug depth texture
            waterFolder
                .add(
                    {
                        showDepthTexture: () => {
                            // Create a simple debug plane to show depth texture
                            this.showDepthTextureDebug()
                        },
                    },
                    'showDepthTexture',
                )
                .name('Show Depth Texture')

            waterFolder
                .add(uniforms.uDebugDepth, 'value', 0, 1, 0.1)
                .name('Debug Depth Mode')

            waterFolder
                .add(
                    {
                        hideShips: () => {
                            this.scene.traverse((object) => {
                                if (
                                    object.name.includes('ship') &&
                                    !object.name.includes('Water')
                                ) {
                                    object.visible = !object.visible
                                }
                            })
                            console.log(
                                'Toggled ship visibility for depth debugging',
                            )
                        },
                    },
                    'hideShips',
                )
                .name('Toggle Ships')

            // Color uniforms
            waterFolder
                .addColor(
                    {
                        Trough:
                            '#' + uniforms.uTroughColor.value.getHexString(),
                    },
                    'Trough',
                )
                .name('Trough Color')
                .onChange((v: string) => {
                    uniforms.uTroughColor.value.set(v)
                })
            waterFolder
                .addColor(
                    {
                        Surface:
                            '#' + uniforms.uSurfaceColor.value.getHexString(),
                    },
                    'Surface',
                )
                .name('Surface Color')
                .onChange((v: string) => {
                    uniforms.uSurfaceColor.value.set(v)
                })
            waterFolder
                .addColor(
                    {
                        Peak: '#' + uniforms.uPeakColor.value.getHexString(),
                    },
                    'Peak',
                )
                .name('Peak Color')
                .onChange((v: string) => {
                    uniforms.uPeakColor.value.set(v)
                })
            console.log('Water folder created with uniforms:', uniforms)
        } else {
            waterFolder
                .add({ error: 'Water uniforms not ready' }, 'error')
                .name('Error')
            console.error('Water uniforms not available in createWaterFolder.')
        }
    }

    private handleResize() {
        const width = this.canvas.clientWidth
        const height = this.canvas.clientHeight

        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(width, height)

        // Resize depth render target and depth texture
        this.depthRenderTarget.setSize(width, height)
        this.depthTexture.image.width = width
        this.depthTexture.image.height = height

        // Update water material resolution uniform
        if (this.waterMaterial) {
            this.waterMaterial.uniforms.uResolution.value.set(width, height)
        }
    }

    private startRenderLoop() {
        const animate = (time: number) => {
            // Animate water shader
            const water = this.scene.getObjectByName('Water') as
                | Mesh
                | undefined
            if (water && (water.material as ShaderMaterial).uniforms?.uTime) {
                ;(water.material as ShaderMaterial).uniforms.uTime.value =
                    time * 0.001
            }
            if (this.waterMaterial) {
                this.waterMaterial.uniforms.bwTexture.value = this.gameWorld
                    .getProceduralTextureSystem()
                    .getTexture()
            }
            this.gameWorld.update(time)

            // Render depth texture (all objects except water)
            this.renderDepthTexture()

            // Render the main scene
            this.renderer.render(this.scene, this.camera)
            requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }

    private renderDepthTexture() {
        // Hide water mesh during depth rendering
        const water = this.scene.getObjectByName('Water') as Mesh | undefined
        const originalVisible = water?.visible
        if (water) {
            water.visible = false
        }

        // Debug: Log what objects are visible during depth rendering
        let visibleObjects = 0
        let islandObjects = 0
        let shipObjects = 0
        const islandMeshes: any[] = []

        this.scene.traverse((object) => {
            if (object.visible && object !== water) {
                visibleObjects++
                if (object.name.includes('island')) {
                    islandObjects++
                    islandMeshes.push(object)
                    console.log(
                        'Island object in depth pass:',
                        object.name,
                        object.position,
                        'type:',
                        object.type,
                    )
                }
                if (object.name.includes('ship')) {
                    shipObjects++
                }
            }
        })

        // Special debugging: ensure island materials write depth
        islandMeshes.forEach((island) => {
            island.traverse((child: any) => {
                if (child.isMesh && child.material) {
                    // Ensure depth writing is enabled
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat: any) => {
                            mat.depthWrite = true
                            mat.depthTest = true
                            mat.transparent = false
                        })
                    } else {
                        child.material.depthWrite = true
                        child.material.depthTest = true
                        child.material.transparent = false
                    }
                }
            })
        })

        if (visibleObjects % 60 === 0) {
            // Log every 60 frames to avoid spam
            console.log(
                `Depth pass: ${visibleObjects} visible objects, ${islandObjects} islands, ${shipObjects} ships`,
            )
        }

        // Store original render target and clear settings
        const currentRenderTarget = this.renderer.getRenderTarget()
        const currentAutoClear = this.renderer.autoClear

        // Configure renderer for depth rendering
        this.renderer.autoClear = true

        // Render depth to render target
        this.renderer.setRenderTarget(this.depthRenderTarget)
        this.renderer.clear()
        this.renderer.render(this.scene, this.camera)
        this.renderer.setRenderTarget(currentRenderTarget)

        // Restore renderer settings
        this.renderer.autoClear = currentAutoClear

        // Restore water visibility
        if (water && originalVisible !== undefined) {
            water.visible = originalVisible
        }
    }

    private showDepthTextureDebug() {
        // Remove existing debug plane
        const existing = this.scene.getObjectByName('DepthDebug')
        if (existing) {
            this.scene.remove(existing)
        } else {
            // Create debug plane to show depth texture
            const debugGeometry = new PlaneGeometry(20, 20)
            const debugMaterial = new MeshBasicMaterial({
                map: this.depthTexture,
                transparent: false,
            })
            const debugPlane = new Mesh(debugGeometry, debugMaterial)
            debugPlane.position.set(30, 10, 0)
            debugPlane.name = 'DepthDebug'
            this.scene.add(debugPlane)
            console.log('Depth texture debug plane created')
        }
    }

    // Cleanup method
    dispose() {
        if (this.gui) {
            this.gui.destroy()
        }
        if (this.gameWorld) {
            this.gameWorld.cleanup()
        }
        if (this.depthRenderTarget) {
            this.depthRenderTarget.dispose()
        }
        if (this.depthTexture) {
            this.depthTexture.dispose()
        }
        if (this.renderer) {
            this.renderer.dispose()
        }
    }
}
