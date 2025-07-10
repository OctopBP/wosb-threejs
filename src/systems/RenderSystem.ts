// Tree-shakeable ES6 imports - only import what we actually use
import { AssetsManager, Mesh, MeshBuilder } from '@babylonjs/core'
import { getModelConfig, isPrimitiveModel } from '../config/ModelConfig'
import { System } from '../ecs/System'
import '@babylonjs/loaders/glTF/2.0'

import type { AbstractMesh, Scene } from '@babylonjs/core'
import type { PositionComponent, RenderableComponent } from '../ecs/Component'
import type { World } from '../ecs/World'

export class RenderSystem extends System {
    private scene: Scene

    constructor(world: World, scene: Scene) {
        super(world, ['position', 'renderable'])
        this.scene = scene
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
                    renderable.mesh.setEnabled(false)
                }
                continue
            }

            if (!renderable.mesh) {
                renderable.mesh = this.createMesh(renderable)
            }

            // Update mesh position and rotation
            if (renderable.mesh) {
                renderable.mesh.setEnabled(true)

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

    private createMesh(renderable: RenderableComponent): AbstractMesh {
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
        const config = getModelConfig(meshType as any)

        let mesh: Mesh

        if ('primitive' in config) {
            switch (config.primitive) {
                case 'sphere':
                    mesh = MeshBuilder.CreateSphere(
                        meshId,
                        config.options,
                        this.scene,
                    )
                    break
                case 'box':
                    mesh = MeshBuilder.CreateBox(
                        meshId,
                        config.options,
                        this.scene,
                    )
                    break
                default:
                    // Fallback to sphere
                    mesh = MeshBuilder.CreateSphere(
                        meshId,
                        { diameter: 0.5 },
                        this.scene,
                    )
            }

            mesh.scaling.setAll(config.scale)
        } else {
            // Fallback
            mesh = MeshBuilder.CreateSphere(
                meshId,
                { diameter: 0.5 },
                this.scene,
            )
        }

        return mesh
    }

    private createModelMesh(meshId: string, meshType: string): Mesh {
        const parentMesh = new Mesh(meshId, this.scene)

        const modelConfig = getModelConfig(meshType as any)

        const assetsManager = new AssetsManager(this.scene)
        const meshTask = assetsManager.addMeshTask(
            `${meshType}_task`,
            '',
            'assets/models/',
            modelConfig.fileName,
        )

        meshTask.onSuccess = (task: any) => {
            if (task.loadedMeshes.length > 0) {
                task.loadedMeshes.forEach((mesh: any) => {
                    mesh.parent = parentMesh
                })
                parentMesh.scaling.setAll(modelConfig.scale)
            }
        }

        meshTask.onError = () => {
            // GLB loading failed - mesh will remain empty
        }

        assetsManager.load()
        return parentMesh
    }

    cleanup(): void {
        // Clean up any remaining meshes
        const entities = this.getEntities()
        for (const entity of entities) {
            const renderable =
                entity.getComponent<RenderableComponent>('renderable')
            if (renderable?.mesh) {
                renderable.mesh.dispose()
                renderable.mesh = undefined
            }
        }
    }
}
