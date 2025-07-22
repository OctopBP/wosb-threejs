import type { Object3D, Scene } from 'three'
import {
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
    Group,
    LoadingManager,
    Mesh,
    MeshLambertMaterial,
    SphereGeometry,
} from 'three'
import { getMaterialConfig } from '../config/MaterialsConfig'
import type { ModelConfig, PrimitiveModelConfig } from '../config/ModelConfig'
import { getModelConfig, isPrimitiveModel } from '../config/ModelConfig'
import { getPrimitiveConfig } from '../config/PrimitivesConfig'
import type { PositionComponent, RenderableComponent } from '../ecs/Component'
import type { World } from '../ecs/World'
import { getModelClone } from '../ModelPreloader'
import { AbstractRenderSystem } from './AbstractRenderSystem'

/**
 * Concrete implementation of AbstractRenderSystem using Three.js
 */
export class ThreeRenderSystem extends AbstractRenderSystem {
    private loadingManager: LoadingManager

    constructor(world: World, scene: Scene) {
        super(world, scene)
        this.loadingManager = new LoadingManager()
    }

    protected createMesh(renderable: RenderableComponent): Object3D | null {
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

    protected addMeshToScene(mesh: Object3D): void {
        this.scene.add(mesh)
    }

    protected removeMeshFromScene(mesh: Object3D): void {
        this.scene.remove(mesh)
    }

    protected updateObjectTransform(
        mesh: Object3D,
        position: PositionComponent,
    ): void {
        // Update position
        mesh.position.x = position.x
        mesh.position.y = position.y
        mesh.position.z = position.z

        // Update rotation
        mesh.rotation.x = position.rotationX
        mesh.rotation.y = position.rotationY
        mesh.rotation.z = position.rotationZ
    }

    protected showObject(object: Object3D): void {
        object.visible = true
    }

    protected hideObject(object: Object3D): void {
        object.visible = false
    }

    protected disposeMesh(mesh: Object3D): void {
        if (mesh instanceof Mesh) {
            if (mesh.geometry) {
                mesh.geometry.dispose()
            }
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    for (const material of mesh.material) {
                        material.dispose()
                    }
                } else {
                    mesh.material.dispose()
                }
            }
        }

        // Recursively dispose of children
        if (mesh instanceof Group) {
            mesh.children.forEach((child) => this.disposeMesh(child))
        }
    }

    private createPrimitiveMesh(meshId: string, meshType: string): Mesh {
        const config = getModelConfig(meshType) as PrimitiveModelConfig

        let geometry:
            | SphereGeometry
            | BoxGeometry
            | CylinderGeometry
            | ConeGeometry
        let material: MeshLambertMaterial

        if ('primitiveRef' in config) {
            const primitiveConfig = getPrimitiveConfig(config.primitiveRef)

            switch (primitiveConfig.shape) {
                case 'sphere':
                    geometry = new SphereGeometry(
                        primitiveConfig.options.diameter / 2 || 0.25,
                        primitiveConfig.options.segments || 8,
                        primitiveConfig.options.segments || 8,
                    )
                    break
                case 'box':
                    geometry = new BoxGeometry(
                        primitiveConfig.options.width || 1.0,
                        primitiveConfig.options.height || 1.0,
                        primitiveConfig.options.depth || 1.0,
                    )
                    break
                case 'cylinder':
                    geometry = new CylinderGeometry(
                        primitiveConfig.options.radiusTop || 0.5,
                        primitiveConfig.options.radiusBottom || 0.5,
                        primitiveConfig.options.height || 1.0,
                        primitiveConfig.options.segments || 8,
                    )
                    break
                case 'cone':
                    geometry = new ConeGeometry(
                        primitiveConfig.options.radius || 0.5,
                        primitiveConfig.options.height || 1.0,
                        primitiveConfig.options.segments || 8,
                    )
                    break
                default:
                    // Fallback to sphere
                    geometry = new SphereGeometry(0.25, 8, 8)
            }

            // Create material based on material reference
            const materialConfig = config.materialRef
                ? getMaterialConfig(config.materialRef)
                : getMaterialConfig('projectile') // fallback

            material = new MeshLambertMaterial(materialConfig.parameters)

            const mesh = new Mesh(geometry, material)
            mesh.name = meshId
            mesh.scale.setScalar(config.scale)
            mesh.castShadow = true
            mesh.receiveShadow = true

            return mesh
        } else {
            // Fallback
            geometry = new SphereGeometry(0.25, 8, 8)
            const fallbackMaterialConfig = getMaterialConfig('fallback')
            material = new MeshLambertMaterial(
                fallbackMaterialConfig.parameters,
            )

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

                    // Apply material override if specified
                    if (modelConfig.materialRef) {
                        const materialConfig = getMaterialConfig(
                            modelConfig.materialRef,
                        )
                        const material = new MeshLambertMaterial(
                            materialConfig.parameters,
                        )
                        child.material = material
                    }
                }
            })
            parentGroup.add(model)
            parentGroup.scale.setScalar(modelConfig.scale)
        } else {
            // Fallback: create a primitive
            const fallbackGeometry = new BoxGeometry(1, 0.5, 2)
            const fallbackMaterialConfig = getMaterialConfig('fallback')
            const fallbackMaterial = new MeshLambertMaterial(
                fallbackMaterialConfig.parameters,
            )
            const fallbackMesh = new Mesh(fallbackGeometry, fallbackMaterial)
            fallbackMesh.castShadow = true
            fallbackMesh.receiveShadow = true
            parentGroup.add(fallbackMesh)
            parentGroup.scale.setScalar(modelConfig.scale)
        }
        return parentGroup
    }
}
