import {
    PlaneGeometry,
    Mesh,
    TextureLoader,
    Color,
    Vector3,
    MathUtils,
    BoxGeometry,
    CylinderGeometry,
    SphereGeometry,
    MeshLambertMaterial,
    RepeatWrapping
} from 'three'
import type { Scene, Camera, WebGLRenderer } from 'three'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import { WaterMaterial } from '../materials/WaterMaterial'
import { getWaterConfig, getIslandConfig, getDebrisConfig } from '../config/WaterConfig'
import type { WaterConfig, IslandConfig, DebrisConfig } from '../config/WaterConfig'

interface WaterComponent {
    material: WaterMaterial
    mesh: Mesh
    time: number
}

interface IslandComponent {
    mesh: Mesh
    initialPosition: Vector3
}

interface DebrisComponent {
    mesh: Mesh
    initialPosition: Vector3
    bobOffset: number
    driftOffset: Vector3
}

export class WaterSystem extends System {
    private scene: Scene
    private camera: Camera
    private renderer: WebGLRenderer
    private waterConfig: WaterConfig
    private islandConfig: IslandConfig
    private debrisConfig: DebrisConfig
    private textureLoader: TextureLoader
    private waterMaterial: WaterMaterial | null = null
    private waterMesh: Mesh | null = null
    private islands: Mesh[] = []
    private debris: Mesh[] = []
    private time: number = 0

    constructor(world: World, scene: Scene, camera: Camera, renderer: WebGLRenderer) {
        super(world, [])
        this.scene = scene
        this.camera = camera
        this.renderer = renderer
        this.waterConfig = getWaterConfig()
        this.islandConfig = getIslandConfig()
        this.debrisConfig = getDebrisConfig()
        this.textureLoader = new TextureLoader()
    }

    async initialize(): Promise<void> {
        await this.createWaterSurface()
        this.createIslands()
        this.createDebris()
    }

    private async createWaterSurface(): Promise<void> {
        try {
            // Load water normals texture
            const waterNormals = await this.loadTexture(this.waterConfig.waterNormals)
            waterNormals.wrapS = RepeatWrapping
            waterNormals.wrapT = RepeatWrapping

            // Create water material
            this.waterMaterial = new WaterMaterial({
                waterNormals,
                sunDirection: new Vector3(
                    this.waterConfig.sunDirection.x,
                    this.waterConfig.sunDirection.y,
                    this.waterConfig.sunDirection.z
                ),
                sunColor: new Color(this.waterConfig.sunColor),
                waterColor: new Color(this.waterConfig.waterColor),
                distortionScale: this.waterConfig.distortionScale,
                fog: this.waterConfig.fog
            })

            // Create water geometry
            const waterGeometry = new PlaneGeometry(
                this.waterConfig.size,
                this.waterConfig.size,
                this.waterConfig.segments,
                this.waterConfig.segments
            )
            waterGeometry.rotateX(-Math.PI / 2)

            // Create water mesh
            this.waterMesh = new Mesh(waterGeometry, this.waterMaterial)
            this.waterMesh.matrixAutoUpdate = false
            this.waterMesh.updateMatrix()

            // Set up material matrix
            this.waterMaterial.matrixWorld = this.waterMesh.matrixWorld

            this.scene.add(this.waterMesh)
        } catch (error) {
            console.warn('Failed to load water normals texture, using fallback', error)
            this.createFallbackWater()
        }
    }

    private createFallbackWater(): void {
        // Create water material without normals
        this.waterMaterial = new WaterMaterial({
            sunDirection: new Vector3(
                this.waterConfig.sunDirection.x,
                this.waterConfig.sunDirection.y,
                this.waterConfig.sunDirection.z
            ),
            sunColor: new Color(this.waterConfig.sunColor),
            waterColor: new Color(this.waterConfig.waterColor),
            distortionScale: this.waterConfig.distortionScale,
            fog: this.waterConfig.fog
        })

        // Create water geometry
        const waterGeometry = new PlaneGeometry(
            this.waterConfig.size,
            this.waterConfig.size,
            this.waterConfig.segments,
            this.waterConfig.segments
        )
        waterGeometry.rotateX(-Math.PI / 2)

        // Create water mesh
        this.waterMesh = new Mesh(waterGeometry, this.waterMaterial)
        this.waterMesh.matrixAutoUpdate = false
        this.waterMesh.updateMatrix()

        // Set up material matrix
        this.waterMaterial.matrixWorld = this.waterMesh.matrixWorld

        this.scene.add(this.waterMesh)
    }

    private loadTexture(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                resolve,
                undefined,
                reject
            )
        })
    }

    private createIslands(): void {
        for (let i = 0; i < this.islandConfig.count; i++) {
            const island = this.createIsland()
            this.islands.push(island)
            this.scene.add(island)
        }
    }

    private createIsland(): Mesh {
        const angle = Math.random() * Math.PI * 2
        const radius = MathUtils.lerp(
            this.islandConfig.position.radius.min,
            this.islandConfig.position.radius.max,
            Math.random()
        )
        const scale = MathUtils.lerp(
            this.islandConfig.scale.min,
            this.islandConfig.scale.max,
            Math.random()
        )
        const height = MathUtils.lerp(
            this.islandConfig.position.height.min,
            this.islandConfig.position.height.max,
            Math.random()
        )

        let geometry
        switch (this.islandConfig.geometry) {
            case 'box':
                geometry = new BoxGeometry(scale, height, scale)
                break
            case 'sphere':
                geometry = new SphereGeometry(scale * 0.5, 8, 6)
                break
            case 'cylinder':
            default:
                geometry = new CylinderGeometry(scale * 0.8, scale, height, 8)
                break
        }

        const material = new MeshLambertMaterial({
            color: this.islandConfig.material.color,
            // Note: MeshLambertMaterial doesn't have roughness/metalness
        })

        const mesh = new Mesh(geometry, material)
        mesh.position.set(
            Math.cos(angle) * radius,
            height / 2,
            Math.sin(angle) * radius
        )

        // Add some random rotation
        mesh.rotation.y = Math.random() * Math.PI * 2

        return mesh
    }

    private createDebris(): void {
        for (let i = 0; i < this.debrisConfig.count; i++) {
            const debrisItem = this.createDebrisItem()
            this.debris.push(debrisItem)
            this.scene.add(debrisItem)
        }
    }

    private createDebrisItem(): Mesh {
        const angle = Math.random() * Math.PI * 2
        const radius = MathUtils.lerp(
            this.debrisConfig.position.radius.min,
            this.debrisConfig.position.radius.max,
            Math.random()
        )
        const scale = MathUtils.lerp(
            this.debrisConfig.scale.min,
            this.debrisConfig.scale.max,
            Math.random()
        )

        // Select random debris type based on probability
        let selectedType = this.debrisConfig.types[0]
        const random = Math.random()
        let cumulativeProbability = 0

        for (const type of this.debrisConfig.types) {
            cumulativeProbability += type.probability
            if (random <= cumulativeProbability) {
                selectedType = type
                break
            }
        }

        let geometry
        switch (selectedType.geometry) {
            case 'box':
                geometry = new BoxGeometry(scale, scale * 0.5, scale * 0.8)
                break
            case 'sphere':
                geometry = new SphereGeometry(scale * 0.4, 6, 4)
                break
            case 'cylinder':
            default:
                geometry = new CylinderGeometry(scale * 0.3, scale * 0.4, scale * 1.5, 6)
                break
        }

        const material = new MeshLambertMaterial({
            color: selectedType.material.color,
        })

        const mesh = new Mesh(geometry, material)
        const baseHeight = MathUtils.lerp(
            this.debrisConfig.position.height.min,
            this.debrisConfig.position.height.max,
            Math.random()
        )

        mesh.position.set(
            Math.cos(angle) * radius,
            baseHeight,
            Math.sin(angle) * radius
        )

        // Add random rotation
        mesh.rotation.set(
            (Math.random() - 0.5) * 0.3,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * 0.3
        )

        // Store initial position and add random offsets for movement
        mesh.userData = {
            initialPosition: mesh.position.clone(),
            bobOffset: Math.random() * Math.PI * 2,
            driftOffset: new Vector3(
                (Math.random() - 0.5) * 2,
                0,
                (Math.random() - 0.5) * 2
            )
        }

        return mesh
    }

    update(deltaTime: number): void {
        this.time += deltaTime

        // Update water material time
        if (this.waterMaterial) {
            this.waterMaterial.updateTime(this.time * this.waterConfig.waveSpeed)
            
            // Update reflection matrix
            this.waterMaterial.updateTextureMatrix(this.camera)
            
            // Render reflection
            if (this.waterMesh) {
                this.waterMesh.visible = false
                this.waterMaterial.render(this.renderer, this.scene, this.camera)
                this.waterMesh.visible = true
            }
        }

        // Update debris movement (bobbing and drifting)
        this.updateDebrisMovement()
    }

    private updateDebrisMovement(): void {
        for (const debrisItem of this.debris) {
            const userData = debrisItem.userData
            if (userData.initialPosition && userData.bobOffset !== undefined) {
                // Bobbing animation
                const bobbing = Math.sin(this.time * this.debrisConfig.movement.bobbing.speed + userData.bobOffset) 
                    * this.debrisConfig.movement.bobbing.amplitude

                // Drift animation
                const driftX = Math.cos(this.time * this.debrisConfig.movement.drift.speed) 
                    * this.debrisConfig.movement.drift.direction.x 
                    * userData.driftOffset.x

                const driftZ = Math.sin(this.time * this.debrisConfig.movement.drift.speed) 
                    * this.debrisConfig.movement.drift.direction.y 
                    * userData.driftOffset.z

                debrisItem.position.copy(userData.initialPosition)
                debrisItem.position.y += bobbing
                debrisItem.position.x += driftX
                debrisItem.position.z += driftZ
            }
        }
    }

    cleanup(): void {
        // Clean up water
        if (this.waterMesh) {
            this.scene.remove(this.waterMesh)
            this.waterMesh.geometry.dispose()
            if (this.waterMaterial) {
                this.waterMaterial.dispose()
            }
        }

        // Clean up islands
        for (const island of this.islands) {
            this.scene.remove(island)
            island.geometry.dispose()
            if (island.material) {
                if (Array.isArray(island.material)) {
                    island.material.forEach(material => material.dispose())
                } else {
                    island.material.dispose()
                }
            }
        }
        this.islands = []

        // Clean up debris
        for (const debrisItem of this.debris) {
            this.scene.remove(debrisItem)
            debrisItem.geometry.dispose()
            if (debrisItem.material) {
                if (Array.isArray(debrisItem.material)) {
                    debrisItem.material.forEach(material => material.dispose())
                } else {
                    debrisItem.material.dispose()
                }
            }
        }
        this.debris = []
    }
}