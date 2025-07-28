import RAPIER from '@dimforge/rapier3d-compat'
import type {
    MovementConfigComponent,
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
            // Ensure RAPIER is properly initialized
            if (!RAPIER.init) {
                throw new Error('RAPIER.init is not available')
            }
            
            await RAPIER.init()
            
            // Wait a bit to ensure WASM is fully loaded
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify RAPIER classes are available
            if (!RAPIER.World || !RAPIER.RigidBodyDesc || !RAPIER.ColliderDesc) {
                throw new Error('RAPIER classes not available after initialization')
            }

            // Create physics world with gravity
            const gravity = new RAPIER.Vector3(0.0, 0.0, 0.0) // No gravity for ship movement
            this.physicsWorld = new RAPIER.World(gravity)

            // Verify the world was created successfully
            if (!this.physicsWorld) {
                throw new Error('Failed to create physics world')
            }

            this.initialized = true
            console.log('Physics system initialized successfully')
        } catch (error) {
            console.error('Failed to initialize physics system:', error)
            this.initialized = false
            this.physicsWorld = null
            throw error
        }
    }

    update(deltaTime: number): void {
        // Check if physics needs reinitialization
        if (!this.initialized || !this.physicsWorld) {
            return
        }

        // Validate physics world health
        if (!this.isPhysicsWorldHealthy()) {
            console.warn('Physics world unhealthy, skipping update')
            return
        }

        // Cache body handles to avoid accessing them during physics step
        const activeBodyHandles = this.cacheActiveBodyHandles()

        if (activeBodyHandles.length > 0) {
            // Apply forces to physics bodies (before stepping)
            this.applyForces()

            // Enforce max speed limits before physics step
            this.enforceMaxSpeeds()

            // Step the physics world with proper timestep
            try {
                // Validate physics world is still valid
                if (!this.physicsWorld || !this.initialized) {
                    throw new Error('Physics world became invalid')
                }

                // Ensure we have a valid timestep (fallback to 16ms if deltaTime is invalid)
                const timestep = (deltaTime && isFinite(deltaTime) && deltaTime > 0) 
                    ? Math.min(deltaTime, 0.1) 
                    : 1/60; // 60 FPS fallback
                
                // Validate timestep before setting
                if (!isFinite(timestep) || timestep <= 0) {
                    throw new Error(`Invalid timestep: ${timestep}`)
                }

                this.physicsWorld.timestep = timestep
                
                // Verify timestep was set correctly
                if (this.physicsWorld.timestep !== timestep) {
                    console.warn('Timestep was not set correctly:', this.physicsWorld.timestep, 'vs', timestep)
                }

                this.physicsWorld.step()
            } catch (error) {
                console.error('Physics step error:', error)
                // Try to reinitialize physics if it seems corrupted
                const errorMessage = error instanceof Error ? error.message : String(error)
                if (errorMessage.includes('memory access out of bounds')) {
                    console.warn('Physics world appears corrupted, marking for reinitialization')
                    this.initialized = false
                    this.physicsWorld = null
                }
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

    private isPhysicsWorldHealthy(): boolean {
        if (!this.physicsWorld || !this.initialized) {
            return false
        }

        try {
            // Try to access basic properties to check if the world is still valid
            const gravity = this.physicsWorld.gravity
            if (!gravity || typeof gravity.x !== 'number') {
                return false
            }

            // Try to get the number of bodies (this often fails if memory is corrupted)
            const bodyCount = this.physicsWorld.bodies ? this.physicsWorld.bodies.len() : 0
            if (typeof bodyCount !== 'number' || bodyCount < 0) {
                return false
            }

            return true
        } catch (error) {
            console.error('Physics world health check failed:', error)
            return false
        }
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

        // Second pass: apply forces safely and enforce max speeds
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

    // Enforce max speed limits for all physics bodies
    private enforceMaxSpeeds(): void {
        if (!this.physicsWorld) return

        const entities = this.world.getEntitiesWithComponents([
            'physicsBody',
            'movementConfig',
        ])

        for (const entity of entities) {
            const physicsBody = entity.getComponent<PhysicsBodyComponent>('physicsBody')
            const config = entity.getComponent<MovementConfigComponent>('movementConfig')

            if (!physicsBody || !config) continue
            if (physicsBody.bodyHandle === -1) continue

            try {
                const body = this.physicsWorld.getRigidBody(physicsBody.bodyHandle)
                if (!body) continue

                // Get current velocity
                const velocity = body.linvel()
                const angularVelocity = body.angvel()

                // Check linear velocity
                const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z)
                if (currentSpeed > config.maxSpeed) {
                    // Scale down velocity to max speed
                    const scale = config.maxSpeed / currentSpeed
                    body.setLinvel({
                        x: velocity.x * scale,
                        y: velocity.y * scale,
                        z: velocity.z * scale,
                    }, true)
                }

                // Check angular velocity (Y-axis for ship turning)
                const currentAngularSpeed = Math.abs(angularVelocity.y)
                if (currentAngularSpeed > config.maxRotationSpeed) {
                    // Scale down angular velocity to max rotation speed
                    const angularScale = config.maxRotationSpeed / currentAngularSpeed
                    body.setAngvel({
                        x: angularVelocity.x,
                        y: angularVelocity.y * angularScale,
                        z: angularVelocity.z,
                    }, true)
                }
            } catch (error) {
                console.error('Error enforcing max speeds:', error)
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
            // Double-check that physics world is still valid
            if (!this.physicsWorld || !this.initialized) {
                throw new Error('Physics world not properly initialized')
            }

            // Verify RAPIER classes are still available
            if (!RAPIER.RigidBodyDesc || !RAPIER.ColliderDesc) {
                throw new Error('RAPIER classes not available')
            }

            // Create rigid body descriptor
            let rigidBodyDesc: any
            try {
                rigidBodyDesc = isStatic 
                    ? RAPIER.RigidBodyDesc.fixed() 
                    : RAPIER.RigidBodyDesc.dynamic()
            } catch (error) {
                throw new Error(`Failed to create rigid body descriptor: ${error}`)
            }

            // Set translation
            try {
                rigidBodyDesc.setTranslation(position.x, position.y, position.z)
            } catch (error) {
                throw new Error(`Failed to set translation: ${error}`)
            }
            
            if (!isStatic) {
                try {
                    // Set mass and damping for dynamic bodies
                    rigidBodyDesc.setAdditionalMass(mass)
                    rigidBodyDesc.setLinearDamping(0.5) // Damping for smooth movement
                    rigidBodyDesc.setAngularDamping(0.8) // Higher angular damping for stability
                } catch (error) {
                    throw new Error(`Failed to set body properties: ${error}`)
                }
            }

            // Create the rigid body
            let rigidBody: any
            try {
                rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc)
                if (!rigidBody) {
                    throw new Error('createRigidBody returned null')
                }
            } catch (error) {
                throw new Error(`Failed to create rigid body: ${error}`)
            }

            // Create box collider descriptor
            let colliderDesc: any
            try {
                colliderDesc = RAPIER.ColliderDesc.cuboid(
                    size.width / 2,
                    size.height / 2,
                    size.depth / 2,
                )
            } catch (error) {
                // Clean up the rigid body if collider creation fails
                try {
                    this.physicsWorld.removeRigidBody(rigidBody)
                } catch (cleanupError) {
                    console.error('Failed to cleanup rigid body:', cleanupError)
                }
                throw new Error(`Failed to create collider descriptor: ${error}`)
            }

            // Create the collider
            let collider: any
            try {
                collider = this.physicsWorld.createCollider(colliderDesc, rigidBody)
                if (!collider) {
                    throw new Error('createCollider returned null')
                }
            } catch (error) {
                // Clean up the rigid body if collider creation fails
                try {
                    this.physicsWorld.removeRigidBody(rigidBody)
                } catch (cleanupError) {
                    console.error('Failed to cleanup rigid body:', cleanupError)
                }
                throw new Error(`Failed to create collider: ${error}`)
            }

            // Validate handles
            if (typeof rigidBody.handle !== 'number' || typeof collider.handle !== 'number') {
                throw new Error('Invalid handles returned from physics body creation')
            }

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

    async reinitialize(): Promise<boolean> {
        console.log('Reinitializing physics system...')
        
        // Dispose current world
        this.dispose()
        
        try {
            // Reinitialize
            await this.init()
            return true
        } catch (error) {
            console.error('Failed to reinitialize physics system:', error)
            return false
        }
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