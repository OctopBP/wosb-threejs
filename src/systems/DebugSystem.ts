import type { Object3D, Scene } from 'three'
import {
    BoxGeometry,
    BufferGeometry,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    MeshBasicMaterial,
    RingGeometry,
    SphereGeometry,
    Vector3,
    WireframeGeometry,
} from 'three'
import { shipBoundaryConfig } from '../config/BoundaryConfig'
import { restrictedZones } from '../config/RestrictedZoneConfig'
import { getAllSpawnZones } from '../config/SpawnZoneConfig'
import type {
    CollisionComponent,
    DebugComponent,
    PositionComponent,
    VelocityComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

interface DebugGizmo {
    mesh: Object3D
    entityId: number
    type:
        | 'shootingPoint'
        | 'collisionShape'
        | 'weaponRange'
        | 'velocityVector'
        | 'restrictedZone'
        | 'spawnZone'
        | 'boundary'
}

export class DebugSystem extends System {
    private scene: Scene
    private debugGizmos: DebugGizmo[] = []
    private shootingPointMaterial: MeshBasicMaterial
    private collisionShapeMaterial: MeshBasicMaterial
    private weaponRangeMaterial: MeshBasicMaterial
    private velocityMaterial: LineBasicMaterial
    private restrictedZoneMaterial: MeshBasicMaterial
    private spawnZoneMaterial: MeshBasicMaterial
    private boundaryMaterial: MeshBasicMaterial

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

        this.restrictedZoneMaterial = new MeshBasicMaterial({
            color: 0xff4444,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
        })

        this.spawnZoneMaterial = new MeshBasicMaterial({
            color: 0x44ff44, // Green for spawn zones
            wireframe: true,
            transparent: true,
            opacity: 0.3,
        })

        this.boundaryMaterial = new MeshBasicMaterial({
            color: 0x00ffff, // Cyan for boundaries
            wireframe: true,
            transparent: true,
            opacity: 0.5,
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
                if (weapon?.shootingPoints) {
                    this.renderShootingPoints(entity.id, position, weapon)
                }
            }

            // Render collision shapes for entities with collision components
            if (debugComponent.showCollisionShapes) {
                const collision =
                    entity.getComponent<CollisionComponent>('collision')
                if (collision) {
                    this.renderCollisionShape(entity.id, position, collision)
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

        // Render restricted zones (only once, not per entity)
        if (debugComponent.showRestrictedZones) {
            this.renderRestrictedZones()
        }

        // Render spawn zones (only once, not per entity)
        if (debugComponent.showSpawnZones) {
            this.renderSpawnZones()
        }

        // Render boundaries (only once, not per entity)
        if (debugComponent.showBoundaries) {
            this.renderBoundaries()
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

            // Transform shooting point coordinates based on ship's rotation
            const cos = Math.cos(-position.rotationY)
            const sin = Math.sin(-position.rotationY)

            // Rotate the shooting point relative to ship's rotation
            const rotatedX = point.x * cos - point.y * sin
            const rotatedZ = point.x * sin + point.y * cos

            // Calculate world position of shooting point
            mesh.position.set(
                position.x + rotatedX,
                position.y + 0.2, // Slightly above the ship
                position.z + rotatedZ,
            )

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
        collision: CollisionComponent,
    ): void {
        // Apply offset if specified
        const offsetX = collision.offset?.x || 0
        const offsetY = collision.offset?.y || 0
        const offsetZ = collision.offset?.z || 0

        if (collision.collider.shape === 'sphere') {
            // Create a sphere wireframe to represent collision boundaries
            const radius = collision.collider.radius
            const geometry = new SphereGeometry(radius, 16, 12)
            const wireframe = new WireframeGeometry(geometry)
            const mesh = new LineSegments(
                wireframe,
                this.collisionShapeMaterial,
            )

            mesh.position.set(
                position.x + offsetX,
                position.y + offsetY,
                position.z + offsetZ,
            )
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
        } else {
            // Create a box wireframe to represent collision boundaries
            const width = collision.collider.width
            const height = collision.collider.height
            const depth = collision.collider.depth
            const geometry = new BoxGeometry(width, height, depth)
            const wireframe = new WireframeGeometry(geometry)
            const mesh = new LineSegments(
                wireframe,
                this.collisionShapeMaterial,
            )

            mesh.position.set(
                position.x + offsetX,
                position.y + offsetY,
                position.z + offsetZ,
            )
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

    public toggleRestrictedZones(enabled: boolean): void {
        const debugEntities = this.getEntities()
        if (debugEntities.length > 0) {
            const debugComponent =
                debugEntities[0].getComponent<DebugComponent>('debug')
            if (debugComponent) {
                debugComponent.showRestrictedZones = enabled
            }
        }
    }

    public toggleSpawnZones(enabled: boolean): void {
        const debugEntities = this.getEntities()
        if (debugEntities.length > 0) {
            const debugComponent =
                debugEntities[0].getComponent<DebugComponent>('debug')
            if (debugComponent) {
                debugComponent.showSpawnZones = enabled
            }
        }
    }

    public toggleBoundaries(enabled: boolean): void {
        const debugEntities = this.getEntities()
        if (debugEntities.length > 0) {
            const debugComponent =
                debugEntities[0].getComponent<DebugComponent>('debug')
            if (debugComponent) {
                debugComponent.showBoundaries = enabled
            }
        }
    }

    private renderRestrictedZones(): void {
        for (let i = 0; i < restrictedZones.length; i++) {
            const zone = restrictedZones[i]

            // Calculate zone dimensions
            const width = zone.maxX - zone.minX
            const depth = zone.maxZ - zone.minZ
            const height = 2.0 // Fixed height for visualization

            // Calculate zone center
            const centerX = (zone.minX + zone.maxX) / 2
            const centerZ = (zone.minZ + zone.maxZ) / 2
            const centerY =
                zone.minY !== undefined ? zone.minY + height / 2 : 1.0

            // Create box geometry for the restricted zone
            const geometry = new BoxGeometry(width, height, depth)
            const mesh = new Mesh(geometry, this.restrictedZoneMaterial)

            // Position the mesh at the zone center
            mesh.position.set(centerX, centerY, centerZ)

            // Add to scene
            this.scene.add(mesh)

            // Track this gizmo for cleanup (use negative ID to distinguish from entity IDs)
            this.debugGizmos.push({
                mesh,
                entityId: -i - 1, // Negative ID for zone visualization
                type: 'restrictedZone',
            })
        }
    }

    private renderSpawnZones(): void {
        const spawnZones = getAllSpawnZones()
        for (let i = 0; i < spawnZones.length; i++) {
            const zone = spawnZones[i]

            // Calculate zone dimensions
            const width = zone.maxX - zone.minX
            const depth = zone.maxZ - zone.minZ
            const height = 1.5 // Slightly smaller height than restricted zones

            // Calculate zone center
            const centerX = (zone.minX + zone.maxX) / 2
            const centerZ = (zone.minZ + zone.maxZ) / 2
            const centerY = 0.5

            // Create box geometry for the spawn zone
            const geometry = new BoxGeometry(width, height, depth)
            const mesh = new Mesh(geometry, this.spawnZoneMaterial)

            // Position the mesh at the zone center
            mesh.position.set(centerX, centerY, centerZ)

            // Add to scene
            this.scene.add(mesh)

            // Track this gizmo for cleanup (use different negative ID range for spawn zones)
            this.debugGizmos.push({
                mesh,
                entityId: -1000 - i - 1, // Different negative ID range for spawn zones
                type: 'spawnZone',
            })
        }
    }

    private renderBoundaries(): void {
        const boundary = shipBoundaryConfig

        // Calculate boundary dimensions
        const width = boundary.maxX - boundary.minX
        const depth = boundary.maxZ - boundary.minZ
        const height = 3.0 // Tall enough to be visible

        // Calculate boundary center
        const centerX = (boundary.minX + boundary.maxX) / 2
        const centerZ = (boundary.minZ + boundary.maxZ) / 2
        const centerY = height / 2

        // Create box geometry for the boundary
        const geometry = new BoxGeometry(width, height, depth)
        const mesh = new Mesh(geometry, this.boundaryMaterial)

        // Position the mesh at the boundary center
        mesh.position.set(centerX, centerY, centerZ)

        // Add to scene
        this.scene.add(mesh)

        // Track this gizmo for cleanup (use unique negative ID for boundary)
        this.debugGizmos.push({
            mesh,
            entityId: -2000, // Unique negative ID for boundary visualization
            type: 'boundary',
        })
    }

    // Cleanup method
    public dispose(): void {
        this.clearDebugGizmos()
        this.shootingPointMaterial.dispose()
        this.collisionShapeMaterial.dispose()
        this.weaponRangeMaterial.dispose()
        this.velocityMaterial.dispose()
        this.restrictedZoneMaterial.dispose()
        this.spawnZoneMaterial.dispose()
        this.boundaryMaterial.dispose()
    }
}
