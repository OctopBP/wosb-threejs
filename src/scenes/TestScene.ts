import {
    BoxGeometry,
    Color,
    DirectionalLight,
    HemisphereLight,
    Mesh,
    MeshLambertMaterial,
    PCFSoftShadowMap,
    type PerspectiveCamera,
    PlaneGeometry,
    type Scene,
    Vector3,
    type WebGLRenderer,
} from 'three'
import { SimpleParticleSystem } from '../systems/ParticleSystem'
import { AbstractScene } from './BaseScene'

export class TestScene extends AbstractScene {
    name = 'test'
    private particleSystems: SimpleParticleSystem[] = []
    private lastParticleSpawn: number = 0
    private particleSpawnInterval: number = 1000 // 1 second in milliseconds
    private testCube: Mesh | null = null

    constructor(
        scene: Scene,
        renderer: WebGLRenderer,
        canvas: HTMLCanvasElement,
        camera: PerspectiveCamera,
    ) {
        super(scene, renderer, canvas, camera)
    }

    init(): void {
        console.log('🧪 Initializing Test Scene')

        // Setup renderer shadows
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = PCFSoftShadowMap
        this.renderer.setClearColor(0x87ceeb, 1) // Sky blue background

        this.setupLighting()
        this.setupEnvironment()
        this.setupCamera()
        this.createTestObjects()

        console.log(
            '✅ Test Scene initialized - Gun smoke particles will spawn every second',
        )
    }

    update(deltaTime: number): void {
        const currentTime = performance.now()

        // Spawn gun smoke particles every second
        if (currentTime - this.lastParticleSpawn > this.particleSpawnInterval) {
            this.spawnGunSmokeParticles()
            this.lastParticleSpawn = currentTime
        }

        // Update all particle systems
        for (const particleSystem of this.particleSystems) {
            particleSystem.update(deltaTime)
        }

        // Rotate test cube for visual feedback
        if (this.testCube) {
            this.testCube.rotation.x += deltaTime * 0.5
            this.testCube.rotation.y += deltaTime * 0.3
        }
    }

    cleanup(): void {
        console.log('🧹 Cleaning up Test Scene')

        // Dispose all particle systems
        for (const particleSystem of this.particleSystems) {
            particleSystem.dispose()
        }
        this.particleSystems = []
        this.testCube = null
    }

    createDebugControls(gui: any): void {
        if (!gui) return

        console.log('🎛️ Creating Test Scene debug controls')

        const testFolder = gui.addFolder('Test Scene Controls')

        // Particle spawn interval control
        const particleControls = {
            spawnInterval: this.particleSpawnInterval / 1000, // Convert to seconds for UI
            spawnNow: () => {
                this.spawnGunSmokeParticles()
                console.log('💨 Gun smoke particles spawned manually')
            },
            clearParticles: () => {
                this.clearAllParticles()
                console.log('🧹 All particles cleared')
            },
            particleCount: this.particleSystems.length,
        }

        testFolder
            .add(particleControls, 'spawnInterval', 0.1, 5.0, 0.1)
            .name('Spawn Interval (sec)')
            .onChange((value: number) => {
                this.particleSpawnInterval = value * 1000
                console.log(`⏱️ Particle spawn interval set to ${value} seconds`)
            })

        testFolder.add(particleControls, 'spawnNow').name('Spawn Particles Now')

        testFolder
            .add(particleControls, 'clearParticles')
            .name('Clear All Particles')

        // Particle count display (read-only)
        const particleCountController = testFolder
            .add(particleControls, 'particleCount')
            .name('Active Particle Systems')
        particleCountController.disable()

        // Update particle count display periodically
        setInterval(() => {
            particleControls.particleCount = this.particleSystems.length
            particleCountController.updateDisplay()
        }, 500)

        // Scene info
        testFolder
            .add(
                {
                    info: () => {
                        console.log('🧪 Test Scene Info:')
                        console.log('- Gun smoke particles spawn every second')
                        console.log(
                            '- Each particle system lasts about 2 seconds',
                        )
                        console.log(
                            '- 50 particles per system, 20 spawns/second',
                        )
                        console.log('- Gray smoke color with upward movement')
                        console.log('- Light gravity pulls particles down')
                        console.log(
                            `- Currently ${this.particleSystems.length} active systems`,
                        )
                    },
                },
                'info',
            )
            .name('Scene Info')
    }

    private setupLighting(): void {
        // Create hemisphere light for general illumination
        const hemisphereLight = new HemisphereLight(0xffffff, 0x444444, 0.8)
        hemisphereLight.position.set(0, 20, 0)
        this.scene.add(hemisphereLight)

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
        this.scene.add(directionalLight)
    }

    private setupEnvironment(): void {
        // Create ground plane
        const groundGeometry = new PlaneGeometry(50, 50)
        const groundMaterial = new MeshLambertMaterial({
            color: new Color(0.3, 0.7, 0.3), // Green ground for test scene
        })
        const ground = new Mesh(groundGeometry, groundMaterial)
        ground.rotation.x = -Math.PI / 2
        ground.receiveShadow = true
        this.scene.add(ground)
    }

    private setupCamera(): void {
        // Position camera for test scene
        this.camera.position.set(0, 8, 10)
        this.camera.lookAt(new Vector3(0, 2, 0))
    }

    private createTestObjects(): void {
        // Create a test cube that rotates
        const cubeGeometry = new BoxGeometry(1, 1, 1)
        const cubeMaterial = new MeshLambertMaterial({ color: 0xff6b6b })
        this.testCube = new Mesh(cubeGeometry, cubeMaterial)
        this.testCube.position.set(0, 2, 0)
        this.testCube.castShadow = true
        this.scene.add(this.testCube)
    }

    private spawnGunSmokeParticles(): void {
        // Create gun smoke particles at random positions around the test cube
        const spawnPosition = new Vector3(
            (Math.random() - 0.5) * 6, // Random X position
            1 + Math.random() * 3, // Random Y position between 1-4
            (Math.random() - 0.5) * 6, // Random Z position
        )

        const gunSmoke = SimpleParticleSystem.createGunSmoke(
            this.scene,
            spawnPosition,
        )
        this.particleSystems.push(gunSmoke)

        console.log(
            `💨 Gun smoke particles spawned at (${spawnPosition.x.toFixed(2)}, ${spawnPosition.y.toFixed(2)}, ${spawnPosition.z.toFixed(2)})`,
        )

        // Clean up old particle systems (remove those that have no particles)
        setTimeout(() => {
            this.cleanupOldParticleSystems()
        }, 3000) // Clean up after 3 seconds
    }

    private cleanupOldParticleSystems(): void {
        const initialCount = this.particleSystems.length

        for (let i = this.particleSystems.length - 1; i >= 0; i--) {
            const system = this.particleSystems[i]
            // Check if the particle system has no active particles
            if (system.particles && system.particles.length === 0) {
                system.dispose()
                this.particleSystems.splice(i, 1)
            }
        }

        const cleanedUp = initialCount - this.particleSystems.length
        if (cleanedUp > 0) {
            console.log(`🧹 Cleaned up ${cleanedUp} old particle systems`)
        }
    }

    private clearAllParticles(): void {
        for (const particleSystem of this.particleSystems) {
            particleSystem.dispose()
        }
        this.particleSystems = []
    }
}
