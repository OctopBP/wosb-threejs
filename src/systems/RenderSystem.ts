// Tree-shakeable ES6 imports - only import what we actually use

import type { Object3D, Scene } from 'three'
import {
    BoxGeometry,
    Group,
    LoadingManager,
    Mesh,
    MeshLambertMaterial,
    SphereGeometry,
} from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { ModelConfig, PrimitiveModelConfig } from '../config/ModelConfig'
import { getModelConfig, isPrimitiveModel } from '../config/ModelConfig'
import type {
    BossComponent,
    PositionComponent,
    RenderableComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class RenderSystem extends System {
    private scene: Scene
    private gltfLoader: GLTFLoader
    private loadingManager: LoadingManager

    constructor(world: World, scene: Scene) {
        super(world, ['position', 'renderable'])
        this.scene = scene
        this.loadingManager = new LoadingManager()
        this.gltfLoader = new GLTFLoader(this.loadingManager)
    }

    update(_deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const renderable =
                entity.getComponent<RenderableComponent>('renderable')

            if (!position || !renderable) continue

            // Skip if not visible
            if (!renderable.visible) {
                if (renderable.mesh) {
                    renderable.mesh.visible = false
                }
                continue
            }

            if (!renderable.mesh) {
                const mesh = this.createMesh(renderable, entity)
                if (mesh) {
                    renderable.mesh = mesh
                    this.scene.add(mesh)
                }
            }

            // Update mesh position and rotation
            if (renderable.mesh) {
                renderable.mesh.visible = true

                // Update position
                renderable.mesh.position.x = position.x
                renderable.mesh.position.y = position.y
                renderable.mesh.position.z = position.z

                // Update rotation
                renderable.mesh.rotation.x = position.rotationX
                renderable.mesh.rotation.y = position.rotationY
                renderable.mesh.rotation.z = position.rotationZ
            }
        }
    }

    private createMesh(
        renderable: RenderableComponent,
        entity: Entity,
    ): Object3D | null {
        // Check if this is a primitive mesh or a model mesh
        if (isPrimitiveModel(renderable.meshType)) {
            return this.createPrimitiveMesh(
                renderable.meshId,
                renderable.meshType,
                entity,
            )
        } else {
            return this.createModelMesh(
                renderable.meshId,
                renderable.meshType,
                entity,
            )
        }
    }

    private createPrimitiveMesh(
        meshId: string,
        meshType: string,
        entity: Entity,
    ): Mesh {
        const config = getModelConfig(meshType) as PrimitiveModelConfig

        // Check if this entity is a boss for additional scaling
        const bossComponent = entity.getComponent<BossComponent>('boss')
        const additionalScale = bossComponent ? bossComponent.scale : 1.0

        let geometry: SphereGeometry | BoxGeometry
        let material: MeshLambertMaterial

        if ('primitive' in config) {
            switch (config.primitive) {
                case 'sphere':
                    geometry = new SphereGeometry(
                        config.options.diameter / 2 || 0.25,
                        config.options.segments || 8,
                        config.options.segments || 8,
                    )
                    break
                default:
                    // Fallback to sphere
                    geometry = new SphereGeometry(0.25, 8, 8)
            }

            // Create material
            material = new MeshLambertMaterial({
                color: 0x000000, // Black color for projectiles
                transparent: false,
            })

            const mesh = new Mesh(geometry, material)
            mesh.name = meshId
            mesh.scale.setScalar(config.scale * additionalScale)
            mesh.castShadow = true
            mesh.receiveShadow = true

            return mesh
        } else {
            // Fallback
            geometry = new SphereGeometry(0.25, 8, 8)
            material = new MeshLambertMaterial({ color: 0x000000 }) // Black color for projectiles
            const mesh = new Mesh(geometry, material)
            mesh.name = meshId
            mesh.scale.setScalar(additionalScale)
            mesh.castShadow = true
            mesh.receiveShadow = true
            return mesh
        }
    }

    private createModelMesh(
        meshId: string,
        meshType: string,
        entity: Entity,
    ): Group {
        const parentGroup = new Group()
        parentGroup.name = meshId

        const modelConfig = getModelConfig(meshType) as ModelConfig

        // Check if this entity is a boss for additional scaling
        const bossComponent = entity.getComponent<BossComponent>('boss')
        const additionalScale = bossComponent ? bossComponent.scale : 1.0
        const finalScale = modelConfig.scale * additionalScale

        // Load the glTF model
        this.gltfLoader.load(
            `assets/models/${modelConfig.fileName}`,
            (gltf: GLTF) => {
                // Success callback
                const model = gltf.scene
                model.traverse((child) => {
                    if (child instanceof Mesh) {
                        child.castShadow = true
                        child.receiveShadow = true
                    }
                })

                parentGroup.add(model)
                parentGroup.scale.setScalar(finalScale)

                if (bossComponent) {
                    console.log(
                        `👾 Boss model loaded with scale: ${finalScale} (base: ${modelConfig.scale}, boss: ${additionalScale})`,
                    )
                }
            },
            (progress: ProgressEvent) => {
                // Progress callback (optional)
                console.log('Loading progress:', progress)
            },
            (error: unknown) => {
                // Error callback - GLB loading failed
                console.warn(
                    `Failed to load model ${modelConfig.fileName}:`,
                    error,
                )

                // Create a fallback primitive instead
                const fallbackGeometry = new BoxGeometry(1, 0.5, 2)
                const fallbackMaterial = new MeshLambertMaterial({
                    color: bossComponent ? 0xff0000 : 0x00ff00, // Red for boss, green for others
                })
                const fallbackMesh = new Mesh(
                    fallbackGeometry,
                    fallbackMaterial,
                )
                fallbackMesh.castShadow = true
                fallbackMesh.receiveShadow = true
                parentGroup.add(fallbackMesh)
                parentGroup.scale.setScalar(finalScale)

                if (bossComponent) {
                    console.log(
                        `👾 Boss fallback model created with scale: ${finalScale}`,
                    )
                }
            },
        )

        return parentGroup
    }

    cleanup(): void {
        // Clean up any remaining meshes
        const entities = this.getEntities()
        for (const entity of entities) {
            const renderable =
                entity.getComponent<RenderableComponent>('renderable')
            if (renderable?.mesh) {
                // Remove from scene
                this.scene.remove(renderable.mesh)

                // Dispose geometry and materials
                if (renderable.mesh instanceof Mesh) {
                    if (renderable.mesh.geometry) {
                        renderable.mesh.geometry.dispose()
                    }
                    if (renderable.mesh.material) {
                        if (Array.isArray(renderable.mesh.material)) {
                            for (const material of renderable.mesh.material) {
                                material.dispose()
                            }
                        } else {
                            renderable.mesh.material.dispose()
                        }
                    }
                }

                renderable.mesh = undefined
            }
        }
    }
}
