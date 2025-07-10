import * as BABYLON from 'babylonjs'
import type { PositionComponent, RenderableComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class RenderSystem extends System {
    private scene: BABYLON.Scene

    constructor(world: World, scene: BABYLON.Scene) {
        super(world, ['position', 'renderable'])
        this.scene = scene
    }

    update(deltaTime: number): void {
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

            // Create mesh if it doesn't exist
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

    private createMesh(renderable: RenderableComponent): BABYLON.Mesh {
        let mesh: BABYLON.Mesh

        switch (renderable.meshType) {
            case 'placeholder':
                mesh = this.createPlaceholderShip(renderable.meshId)
                break
            case 'ship':
                mesh = this.createShipMesh(renderable.meshId)
                break
            case 'enemy':
                mesh = this.createEnemyMesh(renderable.meshId)
                break
            case 'projectile':
                mesh = this.createProjectileMesh(renderable.meshId)
                break
            default:
                mesh = this.createPlaceholderShip(renderable.meshId)
                break
        }

        return mesh
    }

    private createPlaceholderShip(meshId: string): BABYLON.Mesh {
        // Create a simple ship-like shape using boxes
        const hull = BABYLON.MeshBuilder.CreateBox(
            `${meshId}_hull`,
            {
                width: 0.5,
                height: 0.2,
                depth: 1.5,
            },
            this.scene,
        )

        const sail = BABYLON.MeshBuilder.CreateBox(
            `${meshId}_sail`,
            {
                width: 0.05,
                height: 0.8,
                depth: 0.6,
            },
            this.scene,
        )
        sail.position.y = 0.4
        sail.position.z = -0.2

        // Create a parent mesh to group them
        const ship = new BABYLON.Mesh(`${meshId}`, this.scene)
        hull.parent = ship
        sail.parent = ship

        // Create materials
        const hullMaterial = new BABYLON.StandardMaterial(
            `${meshId}_hull_material`,
            this.scene,
        )
        hullMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2) // Brown hull

        const sailMaterial = new BABYLON.StandardMaterial(
            `${meshId}_sail_material`,
            this.scene,
        )
        sailMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.8) // White-ish sail

        hull.material = hullMaterial
        sail.material = sailMaterial

        return ship
    }

    private createShipMesh(meshId: string): BABYLON.Mesh {
        // For now, use the same placeholder - can be replaced with actual ship model later
        return this.createPlaceholderShip(meshId)
    }

    private createEnemyMesh(meshId: string): BABYLON.Mesh {
        // Create a different colored ship for enemies
        const ship = this.createPlaceholderShip(meshId)

        // Change materials to make it look different
        const hullMaterial = new BABYLON.StandardMaterial(
            `${meshId}_enemy_hull_material`,
            this.scene,
        )
        hullMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2) // Red hull

        const sailMaterial = new BABYLON.StandardMaterial(
            `${meshId}_enemy_sail_material`,
            this.scene,
        )
        sailMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3) // Dark sail

        // Apply to child meshes
        ship.getChildMeshes().forEach(
            (child: BABYLON.AbstractMesh, index: number) => {
                if (index === 0) {
                    // Hull
                    ;(child as BABYLON.Mesh).material = hullMaterial
                } else if (index === 1) {
                    // Sail
                    ;(child as BABYLON.Mesh).material = sailMaterial
                }
            },
        )

        return ship
    }

    private createProjectileMesh(meshId: string): BABYLON.Mesh {
        const projectile = BABYLON.MeshBuilder.CreateSphere(
            `${meshId}`,
            {
                diameter: 0.1,
            },
            this.scene,
        )

        const material = new BABYLON.StandardMaterial(
            `${meshId}_material`,
            this.scene,
        )
        material.diffuseColor = new BABYLON.Color3(1, 1, 0) // Yellow projectile
        material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0) // Slight glow

        projectile.material = material
        return projectile
    }

    cleanup(): void {
        // Clean up any remaining meshes
        const entities = this.getEntities()
        for (const entity of entities) {
            const renderable =
                entity.getComponent<RenderableComponent>('renderable')
            if (renderable && renderable.mesh) {
                renderable.mesh.dispose()
                renderable.mesh = null
            }
        }
    }
}
