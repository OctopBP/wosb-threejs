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
import { getModelClone } from '../AssetsPreloader'
import type { ModelConfig, PrimitiveModelConfig } from '../config/ModelConfig'
import { getModelConfig, isPrimitiveModel } from '../config/ModelConfig'
import type { PositionComponent, RenderableComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
export class RenderSystem extends System {
    private scene: Scene
    private loadingManager: LoadingManager

    constructor(world: World, scene: Scene) {
        super(world, ['position', 'renderable'])
        this.scene = scene
        this.loadingManager = new LoadingManager()
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

            // Create mesh if not exists or if meshType has changed
            if (
                !renderable.mesh ||
                renderable.mesh.userData.meshType !== renderable.meshType
            ) {
                // Remove old mesh if it exists
                if (renderable.mesh) {
                    this.scene.remove(renderable.mesh)
                }

                // Create new mesh
                const mesh = this.createMesh(renderable)
                if (mesh) {
                    renderable.mesh = mesh
                    // Store the meshType in userData for tracking changes
                    renderable.mesh.userData.meshType = renderable.meshType
                    this.scene.add(renderable.mesh)
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

    private createMesh(renderable: RenderableComponent): Object3D | null {
        // Check if this is a primitive mesh or a model mesh
        if (isPrimitiveModel(renderable.meshType)) {
            return this.createPrimitiveMesh(
                renderable.meshId,
                renderable.meshType,
            )
        } else {
            return this.createModelMesh(renderable.meshId, renderable.meshType)
        }
    }

    private createPrimitiveMesh(meshId: string, meshType: string): Mesh {
        const config = getModelConfig(meshType) as PrimitiveModelConfig

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
                depthWrite: true,
                depthTest: true,
            })

            const mesh = new Mesh(geometry, material)
            mesh.name = meshId
            mesh.scale.setScalar(config.scale)
            mesh.castShadow = true
            mesh.receiveShadow = true

            return mesh
        } else {
            // Fallback
            geometry = new SphereGeometry(0.25, 8, 8)
            material = new MeshLambertMaterial({
                color: 0x000000,
                transparent: false,
                depthWrite: true,
                depthTest: true,
            })
            const mesh = new Mesh(geometry, material)
            mesh.name = meshId
            mesh.castShadow = true
            mesh.receiveShadow = true
            return mesh
        }
    }

    private createModelMesh(meshId: string, meshType: string): Group {
        const parentGroup = new Group()
        parentGroup.name = meshId

        const modelConfig = getModelConfig(meshType) as ModelConfig

        // Use preloaded model clone
        const model = getModelClone(meshType)
        if (model) {
            model.traverse((child) => {
                if (child instanceof Mesh) {
                    child.castShadow = true
                    child.receiveShadow = true
                }
            })
            parentGroup.add(model)
            parentGroup.scale.setScalar(modelConfig.scale)
        } else {
            // Fallback: create a primitive
            const fallbackGeometry = new BoxGeometry(1, 0.5, 2)
            const fallbackMaterial = new MeshLambertMaterial({
                color: 0xff00ff,
            })
            const fallbackMesh = new Mesh(fallbackGeometry, fallbackMaterial)
            fallbackMesh.castShadow = true
            fallbackMesh.receiveShadow = true
            parentGroup.add(fallbackMesh)
            parentGroup.scale.setScalar(modelConfig.scale)
        }
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
