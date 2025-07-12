import type { Scene } from 'three'
import {
    BoxGeometry,
    Color,
    CylinderGeometry,
    Group,
    Mesh,
    MeshLambertMaterial,
    SphereGeometry,
    Vector3,
} from 'three'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class EnvironmentSystem extends System {
    private scene: Scene
    private environmentGroup: Group
    private islands: Mesh[] = []
    private debris: Mesh[] = []
    private waterLevel: number = 0.8

    constructor(world: World, scene: Scene, waterLevel: number = 0.8) {
        super(world, []) // No specific components needed
        this.scene = scene
        this.waterLevel = waterLevel
        this.environmentGroup = new Group()
        this.environmentGroup.name = 'environment'
        this.scene.add(this.environmentGroup)

        this.createIslands()
        this.createDebris()
    }

    private createIslands(): void {
        const islandConfigs: Array<{
            position: Vector3
            size: number
            type: 'rock' | 'island'
        }> = [
            { position: new Vector3(15, 0, 12), size: 3, type: 'rock' },
            { position: new Vector3(-20, 0, 8), size: 4, type: 'island' },
            { position: new Vector3(25, 0, -15), size: 2.5, type: 'rock' },
            { position: new Vector3(-10, 0, -20), size: 5, type: 'island' },
            { position: new Vector3(8, 0, 25), size: 2, type: 'rock' },
            { position: new Vector3(-25, 0, -5), size: 3.5, type: 'island' },
        ]

        for (const config of islandConfigs) {
            const island = this.createIslandMesh(config.size, config.type)
            island.position.copy(config.position)

            // Position islands so they're partially above water
            island.position.y = this.waterLevel + config.size * 0.3

            this.islands.push(island)
            this.environmentGroup.add(island)
        }
    }

    private createIslandMesh(size: number, type: 'rock' | 'island'): Mesh {
        let geometry: BoxGeometry | SphereGeometry | CylinderGeometry
        let material: MeshLambertMaterial

        if (type === 'rock') {
            // Create irregular rock using scaled sphere
            geometry = new SphereGeometry(size * 0.8, 8, 6)
            material = new MeshLambertMaterial({
                color: new Color('#666666'),
                flatShading: true,
            })
        } else {
            // Create island using flattened cylinder
            geometry = new CylinderGeometry(size, size * 1.2, size * 0.8, 8)
            material = new MeshLambertMaterial({
                color: new Color('#8B4513'),
                flatShading: true,
            })
        }

        const mesh = new Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true

        // Add some random rotation for variety
        mesh.rotation.y = Math.random() * Math.PI * 2
        mesh.rotation.x = (Math.random() - 0.5) * 0.3
        mesh.rotation.z = (Math.random() - 0.5) * 0.3

        return mesh
    }

    private createDebris(): void {
        const debrisCount = 15
        const radius = 40 // Spawn radius around origin

        for (let i = 0; i < debrisCount; i++) {
            const debris = this.createDebrisMesh()

            // Random position around the scene
            const angle = Math.random() * Math.PI * 2
            const distance = Math.random() * radius + 10
            debris.position.x = Math.cos(angle) * distance
            debris.position.z = Math.sin(angle) * distance
            debris.position.y = this.waterLevel + Math.random() * 0.2 - 0.1

            this.debris.push(debris)
            this.environmentGroup.add(debris)
        }
    }

    private createDebrisMesh(): Mesh {
        const debrisTypes = [
            {
                type: 'barrel',
                geometry: new CylinderGeometry(0.5, 0.5, 1, 8),
                color: '#8B4513',
            },
            {
                type: 'crate',
                geometry: new BoxGeometry(1, 1, 1),
                color: '#CD853F',
            },
            {
                type: 'plank',
                geometry: new BoxGeometry(2, 0.2, 0.5),
                color: '#DEB887',
            },
            {
                type: 'ball',
                geometry: new SphereGeometry(0.4, 8, 8),
                color: '#654321',
            },
        ]

        const debrisType =
            debrisTypes[Math.floor(Math.random() * debrisTypes.length)]
        const material = new MeshLambertMaterial({
            color: new Color(debrisType.color),
            flatShading: true,
        })

        const mesh = new Mesh(debrisType.geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true

        // Add random rotation
        mesh.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
        )

        return mesh
    }

    update(deltaTime: number): void {
        // Gently animate floating debris
        this.debris.forEach((debris, index) => {
            const time = Date.now() * 0.001 + index * 0.5
            debris.position.y = this.waterLevel + Math.sin(time) * 0.1
            debris.rotation.y += deltaTime * 0.2
        })
    }

    setWaterLevel(level: number): void {
        this.waterLevel = level

        // Update island positions
        this.islands.forEach((island) => {
            const baseY = this.waterLevel + island.scale.x * 0.3
            island.position.y = baseY
        })
    }

    cleanup(): void {
        if (this.environmentGroup) {
            this.scene.remove(this.environmentGroup)

            // Dispose all geometries and materials
            this.islands.forEach((island) => {
                if (island.geometry) island.geometry.dispose()
                if (island.material) {
                    if (Array.isArray(island.material)) {
                        island.material.forEach((mat) => mat.dispose())
                    } else {
                        island.material.dispose()
                    }
                }
            })

            this.debris.forEach((debris) => {
                if (debris.geometry) debris.geometry.dispose()
                if (debris.material) {
                    if (Array.isArray(debris.material)) {
                        debris.material.forEach((mat) => mat.dispose())
                    } else {
                        debris.material.dispose()
                    }
                }
            })

            this.islands = []
            this.debris = []
        }
    }
}
