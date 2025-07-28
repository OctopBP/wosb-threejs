import RAPIER from '@dimforge/rapier3d-compat'
import type {
    PhysicsBodyComponent,
    PhysicsForceComponent,
    PositionComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class PhysicsSystem extends System {
    private physicsWorld: RAPIER.World | null = null
    private initialized = false

    constructor(world: World) {
        super(world, []) // We'll manually query entities
    }

    async init(): Promise<void> {
        if (this.initialized) return

        try {
            // Initialize Rapier (needed for the compat version)
            await RAPIER.init()

            // Create physics world with gravity
            const gravity = { x: 0.0, y: 0.0, z: 0.0 } // No gravity for ship movement
            this.physicsWorld = new RAPIER.World(gravity)

            this.initialized = true
        } catch (error) {
            console.error('Failed to initialize physics system:', error)
            throw error
        }
    }

    update(deltaTime: number): void {
        if (!this.initialized || !this.physicsWorld) return

        // Cache body handles to avoid accessing them during physics step
        const activeBodyHandles = this.cacheActiveBodyHandles()

        if (activeBodyHandles.length > 0) {
            // Apply forces to physics bodies (before stepping)
            this.applyForces()

            // Step the physics world with proper timestep
            try {
                // Ensure we have a valid timestep (fallback to 16ms if deltaTime is invalid)
                const timestep = (deltaTime && isFinite(deltaTime) && deltaTime > 0) 
                    ? Math.min(deltaTime, 0.1) 
                    : 1/60; // 60 FPS fallback
                
                this.physicsWorld.timestep = timestep
                this.physicsWorld.step()
            } catch (error) {
                console.error('Physics step error:', error)
                return
            }

            // Synchronize physics positions back to ECS components (after stepping)
            this.synchronizePositions()

            // Clear forces for next frame
            this.clearForces()
        }
    }

    private cacheActiveBodyHandles(): number[] {
        if (!this.physicsWorld) return []
        
        const entities = this.world.getEntitiesWithComponents(['physicsBody', 'position'])
        const activeHandles: number[] = []

        for (const entity of entities) {
            const physicsBody = entity.getComponent<PhysicsBodyComponent>('physicsBody')
            if (physicsBody && physicsBody.bodyHandle !== -1) {
                // Verify the body actually exists in the physics world
                const body = this.physicsWorld.getRigidBody(physicsBody.bodyHandle)
                if (body) {
                    activeHandles.push(physicsBody.bodyHandle)
                }
            }
        }

        return activeHandles
    }

    private applyForces(): void {
        if (!this.physicsWorld) return
        
        // Collect force data before applying to avoid iterator invalidation
        const forceData: Array<{
            bodyHandle: number,
            forces: { x: number, y: number, z: number },
            torques: { x: number, y: number, z: number }
        }> = []

        const entities = this.world.getEntitiesWithComponents([
            'physicsBody',
            'physicsForce',
        ])

        // First pass: collect all force data
        for (const entity of entities) {
            const physicsBody = entity.getComponent<PhysicsBodyComponent>('physicsBody')
            const physicsForce = entity.getComponent<PhysicsForceComponent>('physicsForce')

            if (!physicsBody || !physicsForce) continue
            if (physicsBody.bodyHandle === -1) continue // Skip uninitialized bodies

            // Validate forces are finite
            const validForces = isFinite(physicsForce.forceX) && isFinite(physicsForce.forceY) && isFinite(physicsForce.forceZ)
            const validTorques = isFinite(physicsForce.torqueX) && isFinite(physicsForce.torqueY) && isFinite(physicsForce.torqueZ)

            if (validForces || validTorques) {
                forceData.push({
                    bodyHandle: physicsBody.bodyHandle,
                    forces: {
                        x: validForces ? physicsForce.forceX : 0,
                        y: validForces ? physicsForce.forceY : 0,
                        z: validForces ? physicsForce.forceZ : 0,
                    },
                    torques: {
                        x: validTorques ? physicsForce.torqueX : 0,
                        y: validTorques ? physicsForce.torqueY : 0,
                        z: validTorques ? physicsForce.torqueZ : 0,
                    }
                })
            }
        }

        // Second pass: apply forces safely
        for (const data of forceData) {
            try {
                const body = this.physicsWorld.getRigidBody(data.bodyHandle)
                if (!body) continue

                // Apply linear forces
                if (data.forces.x !== 0 || data.forces.y !== 0 || data.forces.z !== 0) {
                    body.addForce(data.forces, true)
                }

                // Apply torque
                if (data.torques.x !== 0 || data.torques.y !== 0 || data.torques.z !== 0) {
                    body.addTorque(data.torques, true)
                }
            } catch (error) {
                console.error('Error applying forces to body:', error)
            }
        }
    }

    private synchronizePositions(): void {
        if (!this.physicsWorld) return
        
        // Collect position data first to avoid iterator issues
        const positionUpdates: Array<{
            entity: Entity,
            translation: { x: number, y: number, z: number },
            rotation: { x: number, y: number, z: number }
        }> = []

        const entities = this.world.getEntitiesWithComponents([
            'physicsBody',
            'position',
        ])

        // First pass: collect position data from physics bodies
        for (const entity of entities) {
            const physicsBody = entity.getComponent<PhysicsBodyComponent>('physicsBody')

            if (!physicsBody) continue
            if (physicsBody.bodyHandle === -1) continue // Skip uninitialized bodies

            try {
                const body = this.physicsWorld.getRigidBody(physicsBody.bodyHandle)
                if (!body) continue

                // Get physics body position and rotation
                const translation = body.translation()
                const rotation = body.rotation()

                // Validate translation values
                if (isFinite(translation.x) && isFinite(translation.y) && isFinite(translation.z)) {
                    // Convert quaternion to Euler angles
                    const euler = this.quaternionToEuler(rotation)
                    if (isFinite(euler.x) && isFinite(euler.y) && isFinite(euler.z)) {
                        positionUpdates.push({
                            entity,
                            translation: { x: translation.x, y: translation.y, z: translation.z },
                            rotation: { x: euler.x, y: euler.y, z: euler.z }
                        })
                    }
                }
            } catch (error) {
                console.error('Error reading position from physics body:', error)
            }
        }

        // Second pass: apply position updates to ECS components
        for (const update of positionUpdates) {
            try {
                const position = update.entity.getComponent<PositionComponent>('position')
                if (position) {
                    position.x = update.translation.x
                    position.y = update.translation.y
                    position.z = update.translation.z
                    position.rotationX = update.rotation.x
                    position.rotationY = update.rotation.y
                    position.rotationZ = update.rotation.z
                }
            } catch (error) {
                console.error('Error updating ECS position:', error)
            }
        }
    }

    private clearForces(): void {
        const entities = this.world.getEntitiesWithComponents(['physicsForce'])

        for (const entity of entities) {
            const physicsForce = entity.getComponent<PhysicsForceComponent>('physicsForce')
            if (!physicsForce) continue

            // Clear all forces for next frame
            physicsForce.forceX = 0
            physicsForce.forceY = 0
            physicsForce.forceZ = 0
            physicsForce.torqueX = 0
            physicsForce.torqueY = 0
            physicsForce.torqueZ = 0
        }
    }

    // Helper method to convert quaternion to Euler angles
    private quaternionToEuler(q: RAPIER.Rotation): { x: number; y: number; z: number } {
        const { x, y, z, w } = q

        // Roll (x-axis rotation)
        const sinr_cosp = 2 * (w * x + y * z)
        const cosr_cosp = 1 - 2 * (x * x + y * y)
        const roll = Math.atan2(sinr_cosp, cosr_cosp)

        // Pitch (y-axis rotation)
        const sinp = 2 * (w * y - z * x)
        const pitch = Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI / 2 : Math.asin(sinp)

        // Yaw (z-axis rotation)
        const siny_cosp = 2 * (w * z + x * y)
        const cosy_cosp = 1 - 2 * (y * y + z * z)
        const yaw = Math.atan2(siny_cosp, cosy_cosp)

        return { x: roll, y: pitch, z: yaw }
    }

    // Public methods for creating and managing physics bodies

    createBoxBody(
        position: { x: number; y: number; z: number },
        size: { width: number; height: number; depth: number },
        isStatic = false,
        mass = 1.0,
    ): { bodyHandle: number; colliderHandle: number } | null {
        if (!this.initialized || !this.physicsWorld) return null

        // Validate input parameters
        if (!isFinite(position.x) || !isFinite(position.y) || !isFinite(position.z)) {
            console.error('Invalid position for physics body:', position)
            return null
        }
        
        if (size.width <= 0 || size.height <= 0 || size.depth <= 0) {
            console.error('Invalid size for physics body:', size)
            return null
        }

        try {
            // Create rigid body
            const rigidBodyDesc = isStatic 
                ? RAPIER.RigidBodyDesc.fixed() 
                : RAPIER.RigidBodyDesc.dynamic()

            rigidBodyDesc.setTranslation(position.x, position.y, position.z)
            
            if (!isStatic) {
                // Set mass and damping for dynamic bodies
                rigidBodyDesc.setAdditionalMass(mass)
                rigidBodyDesc.setLinearDamping(0.5) // Damping for smooth movement
                rigidBodyDesc.setAngularDamping(0.8) // Higher angular damping for stability
            }

            const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc)

            // Create box collider
            const colliderDesc = RAPIER.ColliderDesc.cuboid(
                size.width / 2,
                size.height / 2,
                size.depth / 2,
            )

            const collider = this.physicsWorld.createCollider(colliderDesc, rigidBody)

            return {
                bodyHandle: rigidBody.handle,
                colliderHandle: collider.handle,
            }
        } catch (error) {
            console.error('Error creating physics body:', error)
            return null
        }
    }

    removePhysicsBody(bodyHandle: number, colliderHandle: number): void {
        if (!this.initialized || !this.physicsWorld) return

        try {
            // Remove collider first
            if (colliderHandle !== -1) {
                const collider = this.physicsWorld.getCollider(colliderHandle)
                if (collider) {
                    this.physicsWorld.removeCollider(collider, true)
                }
            }

            // Then remove the rigid body
            if (bodyHandle !== -1) {
                const body = this.physicsWorld.getRigidBody(bodyHandle)
                if (body) {
                    this.physicsWorld.removeRigidBody(body)
                }
            }
        } catch (error) {
            console.error('Error removing physics body:', error)
        }
    }

    // Clean up physics bodies for removed entities
    cleanupRemovedEntities(): void {
        if (!this.initialized || !this.physicsWorld) return

        const entities = this.world.getEntitiesWithComponents(['physicsBody'])
        const validEntityIds = new Set(entities.map(e => e.id))
        
        // Track which bodies should be removed (this is just a conceptual example)
        // In a real implementation, you'd need a way to track removed entities
        
        // For now, just validate that all physics bodies have corresponding entities
        entities.forEach(entity => {
            const physicsBody = entity.getComponent<PhysicsBodyComponent>('physicsBody')
            if (physicsBody && physicsBody.bodyHandle !== -1) {
                const body = this.physicsWorld!.getRigidBody(physicsBody.bodyHandle)
                if (!body) {
                    // Physics body was removed but ECS component still references it
                    physicsBody.bodyHandle = -1
                    physicsBody.colliderHandle = -1
                }
            }
        })
    }

    dispose(): void {
        if (this.physicsWorld) {
            try {
                // Clear all bodies before disposing the world
                this.physicsWorld.bodies.forEach(body => {
                    this.physicsWorld!.removeRigidBody(body)
                })
                this.physicsWorld.free()
            } catch (error) {
                console.error('Error disposing physics world:', error)
            }
            this.physicsWorld = null
        }
        this.initialized = false
    }
}