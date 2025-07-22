import type { Object3D, Scene } from 'three'
import type { PositionComponent, RenderableComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

/**
 * Abstract RenderSystem that defines the interface for rendering entities.
 * Concrete implementations should extend this class and implement the abstract methods.
 */
export abstract class AbstractRenderSystem extends System {
    protected scene: Scene

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
                    this.hideObject(renderable.mesh)
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
                    this.removeMeshFromScene(renderable.mesh)
                }

                // Create new mesh
                const mesh = this.createMesh(renderable)
                if (mesh) {
                    renderable.mesh = mesh
                    // Store the meshType in userData for tracking changes
                    renderable.mesh.userData.meshType = renderable.meshType
                    this.addMeshToScene(renderable.mesh)
                }
            }

            // Update mesh position and rotation
            if (renderable.mesh) {
                this.showObject(renderable.mesh)
                this.updateObjectTransform(renderable.mesh, position)
            }
        }
    }

    cleanup(): void {
        const entities = this.getEntities()
        for (const entity of entities) {
            const renderable =
                entity.getComponent<RenderableComponent>('renderable')
            if (renderable?.mesh) {
                this.removeMeshFromScene(renderable.mesh)
                this.disposeMesh(renderable.mesh)
                renderable.mesh = undefined
            }
        }
    }

    // Abstract methods that concrete implementations must provide

    /**
     * Create a mesh object for the given renderable component
     */
    protected abstract createMesh(
        renderable: RenderableComponent,
    ): Object3D | null

    /**
     * Add a mesh to the rendering scene
     */
    protected abstract addMeshToScene(mesh: Object3D): void

    /**
     * Remove a mesh from the rendering scene
     */
    protected abstract removeMeshFromScene(mesh: Object3D): void

    /**
     * Update the transform (position, rotation, scale) of an object
     */
    protected abstract updateObjectTransform(
        mesh: Object3D,
        position: PositionComponent,
    ): void

    /**
     * Show/make visible an object
     */
    protected abstract showObject(object: Object3D): void

    /**
     * Hide/make invisible an object
     */
    protected abstract hideObject(object: Object3D): void

    /**
     * Dispose of mesh resources (geometry, materials, etc.)
     */
    protected abstract disposeMesh(mesh: Object3D): void
}
