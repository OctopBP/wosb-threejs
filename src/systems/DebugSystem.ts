import {
    BufferGeometry,
    CircleGeometry,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    MeshBasicMaterial,
    type Object3D,
    RingGeometry,
    type Scene,
    SphereGeometry,
    Vector3,
    WireframeGeometry,
} from 'three'
import type {
    DebugComponent,
    PositionComponent,
    RenderableComponent,
    VelocityComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

interface DebugGizmo {
    mesh: Object3D
    entityId: number
    type: 'shootingPoint' | 'collisionShape' | 'weaponRange' | 'velocityVector'
}

export class DebugSystem extends System {
    private scene: Scene
    private debugGizmos: DebugGizmo[] = []
    private shootingPointMaterial: MeshBasicMaterial
    private collisionShapeMaterial: MeshBasicMaterial
    private weaponRangeMaterial: MeshBasicMaterial
    private velocityMaterial: LineBasicMaterial

    constructor(world: World, scene: Scene) {
        super(world, ['debug'])
        this.scene = scene

        // Initialize materials for different debug visualizations
        this.shootingPointMaterial = new MeshBasicMaterial({
            color: 0xff0000,
            wireframe: false,
            transparent: true,
            opacity: 0.8,
        })

        this.collisionShapeMaterial = new MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.6,
        })

        this.weaponRangeMaterial = new MeshBasicMaterial({
            color: 0x0000ff,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
        })

        this.velocityMaterial = new LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8,
        })
    }

    update(_deltaTime: number): void {
        // Clear existing debug gizmos
        this.clearDebugGizmos()

        // Get the debug component (assuming there's only one global debug entity)
        const debugEntities = this.getEntities()
        const debugEntity = debugEntities[0]

        if (!debugEntity) return

        const debugComponent = debugEntity.getComponent<DebugComponent>('debug')
        if (!debugComponent || !debugComponent.enabled) return

        // Get all entities that might need debug visualization
        const entitiesWithPositions = this.world.getEntitiesWithComponents([
            'position',
        ])

        for (const entity of entitiesWithPositions) {
            const position = entity.getComponent<PositionComponent>('position')
            if (!position) continue

            // Render shooting points for entities with weapons
            if (debugComponent.showShootingPoints) {
                const weapon = entity.getComponent<WeaponComponent>('weapon')
                if (weapon && weapon.shootingPoints) {
                    this.renderShootingPoints(entity.id, position, weapon)
                }
            }

            // Render collision shapes for entities with renderable components
            if (debugComponent.showCollisionShapes) {
                const renderable =
                    entity.getComponent<RenderableComponent>('renderable')
                if (renderable) {
                    this.renderCollisionShape(entity.id, position)
                }
            }

            // Render weapon ranges
            if (debugComponent.showWeaponRange) {
                const weapon = entity.getComponent<WeaponComponent>('weapon')
                if (weapon) {
                    this.renderWeaponRange(entity.id, position, weapon)
                }
            }

            // Render velocity vectors
            if (debugComponent.showVelocityVectors) {
                const velocity =
                    entity.getComponent<VelocityComponent>('velocity')
                if (
                    velocity &&
                    (velocity.dx !== 0 ||
                        velocity.dy !== 0 ||
                        velocity.dz !== 0)
                ) {
                    this.renderVelocityVector(entity.id, position, velocity)
                }
            }
        }
    }

    private renderShootingPoints(
        entityId: number,
        position: PositionComponent,
        weapon: WeaponComponent,
    ): void {
        if (!weapon.shootingPoints) return

        for (let i = 0; i < weapon.shootingPoints.length; i++) {
            const point = weapon.shootingPoints[i]

            // Create a small sphere to represent the shooting point
            const geometry = new SphereGeometry(0.1, 8, 6)
            const mesh = new Mesh(geometry, this.shootingPointMaterial)

            // Calculate world position of shooting point
            // Note: shootingPoints are relative to the ship's position
            mesh.position.set(
                position.x + point.x,
                position.y + 0.2, // Slightly above the ship
                position.z + point.y, // Note: point.y maps to world z
            )

            // Apply ship's rotation to shooting point
            mesh.rotation.y = position.rotationY

            this.scene.add(mesh)
            this.debugGizmos.push({
                mesh,
                entityId,
                type: 'shootingPoint',
            })
        }
    }

    private renderCollisionShape(
        entityId: number,
        position: PositionComponent,
    ): void {
        // Create a sphere wireframe to represent collision boundaries
        // Using the same collision radius as CollisionSystem
        const geometry = new SphereGeometry(0.8, 16, 12)
        const wireframe = new WireframeGeometry(geometry)
        const mesh = new LineSegments(wireframe, this.collisionShapeMaterial)

        mesh.position.set(position.x, position.y, position.z)
        mesh.rotation.set(
            position.rotationX,
            position.rotationY,
            position.rotationZ,
        )

        this.scene.add(mesh)
        this.debugGizmos.push({
            mesh,
            entityId,
            type: 'collisionShape',
        })
    }

    private renderWeaponRange(
        entityId: number,
        position: PositionComponent,
        weapon: WeaponComponent,
    ): void {
        // Create a circular ring to show weapon range
        const geometry = new RingGeometry(weapon.range - 0.1, weapon.range, 32)
        const mesh = new Mesh(geometry, this.weaponRangeMaterial)

        mesh.position.set(position.x, position.y + 0.01, position.z) // Slightly above ground
        mesh.rotation.x = -Math.PI / 2 // Rotate to lie flat on ground

        this.scene.add(mesh)
        this.debugGizmos.push({
            mesh,
            entityId,
            type: 'weaponRange',
        })

        // Also show detection range for auto-targeting weapons
        if (weapon.isAutoTargeting && weapon.detectionRange !== weapon.range) {
            const detectionGeometry = new RingGeometry(
                weapon.detectionRange - 0.1,
                weapon.detectionRange,
                32,
            )
            const detectionMesh = new Mesh(
                detectionGeometry,
                new MeshBasicMaterial({
                    color: 0xff8800,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.2,
                }),
            )

            detectionMesh.position.set(
                position.x,
                position.y + 0.02,
                position.z,
            )
            detectionMesh.rotation.x = -Math.PI / 2

            this.scene.add(detectionMesh)
            this.debugGizmos.push({
                mesh: detectionMesh,
                entityId,
                type: 'weaponRange',
            })
        }
    }

    private renderVelocityVector(
        entityId: number,
        position: PositionComponent,
        velocity: VelocityComponent,
    ): void {
        // Create a line showing velocity direction and magnitude
        const velocityMagnitude = Math.sqrt(
            velocity.dx * velocity.dx +
                velocity.dy * velocity.dy +
                velocity.dz * velocity.dz,
        )

        if (velocityMagnitude < 0.1) return // Don't show very small velocities

        const points = []
        points.push(new Vector3(position.x, position.y + 0.5, position.z))

        // Scale velocity for visibility
        const scale = 2.0
        points.push(
            new Vector3(
                position.x + velocity.dx * scale,
                position.y + 0.5 + velocity.dy * scale,
                position.z + velocity.dz * scale,
            ),
        )

        const geometry = new BufferGeometry().setFromPoints(points)
        const mesh = new LineSegments(geometry, this.velocityMaterial)

        this.scene.add(mesh)
        this.debugGizmos.push({
            mesh,
            entityId,
            type: 'velocityVector',
        })
    }

    private clearDebugGizmos(): void {
        for (const gizmo of this.debugGizmos) {
            this.scene.remove(gizmo.mesh)

            // Clean up geometry and materials
            if (gizmo.mesh instanceof Mesh) {
                gizmo.mesh.geometry.dispose()
            } else if (gizmo.mesh instanceof LineSegments) {
                gizmo.mesh.geometry.dispose()
            }
        }
        this.debugGizmos = []
    }

    // Public method to toggle debug features
    public setDebugEnabled(enabled: boolean): void {
        const debugEntities = this.getEntities()
        if (debugEntities.length > 0) {
            const debugComponent =
                debugEntities[0].getComponent<DebugComponent>('debug')
            if (debugComponent) {
                debugComponent.enabled = enabled
            }
        }
    }

    // Public methods to toggle specific debug features
    public toggleShootingPoints(enabled: boolean): void {
        const debugEntities = this.getEntities()
        if (debugEntities.length > 0) {
            const debugComponent =
                debugEntities[0].getComponent<DebugComponent>('debug')
            if (debugComponent) {
                debugComponent.showShootingPoints = enabled
            }
        }
    }

    public toggleCollisionShapes(enabled: boolean): void {
        const debugEntities = this.getEntities()
        if (debugEntities.length > 0) {
            const debugComponent =
                debugEntities[0].getComponent<DebugComponent>('debug')
            if (debugComponent) {
                debugComponent.showCollisionShapes = enabled
            }
        }
    }

    public toggleWeaponRange(enabled: boolean): void {
        const debugEntities = this.getEntities()
        if (debugEntities.length > 0) {
            const debugComponent =
                debugEntities[0].getComponent<DebugComponent>('debug')
            if (debugComponent) {
                debugComponent.showWeaponRange = enabled
            }
        }
    }

    public toggleVelocityVectors(enabled: boolean): void {
        const debugEntities = this.getEntities()
        if (debugEntities.length > 0) {
            const debugComponent =
                debugEntities[0].getComponent<DebugComponent>('debug')
            if (debugComponent) {
                debugComponent.showVelocityVectors = enabled
            }
        }
    }

    // Cleanup method
    public dispose(): void {
        this.clearDebugGizmos()
        this.shootingPointMaterial.dispose()
        this.collisionShapeMaterial.dispose()
        this.weaponRangeMaterial.dispose()
        this.velocityMaterial.dispose()
    }
}
