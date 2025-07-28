import RAPIER from '@dimforge/rapier3d-compat'
import type {
    PhysicsBodyComponent,
    PhysicsForceComponent,
    PositionComponent,
} from '../ecs/Component'
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

        // Initialize Rapier (needed for the compat version)
        await RAPIER.init()

        // Create physics world with gravity
        const gravity = { x: 0.0, y: 0.0, z: 0.0 } // No gravity for ship movement
        this.physicsWorld = new RAPIER.World(gravity)

        this.initialized = true
    }

    update(deltaTime: number): void {
        if (!this.initialized || !this.physicsWorld) return

        // Apply forces to physics bodies
        this.applyForces()

        // Step the physics world
        this.physicsWorld.step()

        // Synchronize physics positions back to ECS components
        this.synchronizePositions()

        // Clear forces for next frame
        this.clearForces()
    }

    private applyForces(): void {
        if (!this.physicsWorld) return
        
        const entities = this.world.getEntitiesWithComponents([
            'physicsBody',
            'physicsForce',
        ])

        for (const entity of entities) {
            const physicsBody = entity.getComponent<PhysicsBodyComponent>('physicsBody')
            const physicsForce = entity.getComponent<PhysicsForceComponent>('physicsForce')

            if (!physicsBody || !physicsForce) continue

            const body = this.physicsWorld.getRigidBody(physicsBody.bodyHandle)
            if (!body) continue

            // Apply linear forces
            if (physicsForce.forceX !== 0 || physicsForce.forceY !== 0 || physicsForce.forceZ !== 0) {
                body.addForce({
                    x: physicsForce.forceX,
                    y: physicsForce.forceY,
                    z: physicsForce.forceZ,
                }, true)
            }

            // Apply torque
            if (physicsForce.torqueX !== 0 || physicsForce.torqueY !== 0 || physicsForce.torqueZ !== 0) {
                body.addTorque({
                    x: physicsForce.torqueX,
                    y: physicsForce.torqueY,
                    z: physicsForce.torqueZ,
                }, true)
            }
        }
    }

    private synchronizePositions(): void {
        if (!this.physicsWorld) return
        
        const entities = this.world.getEntitiesWithComponents([
            'physicsBody',
            'position',
        ])

        for (const entity of entities) {
            const physicsBody = entity.getComponent<PhysicsBodyComponent>('physicsBody')
            const position = entity.getComponent<PositionComponent>('position')

            if (!physicsBody || !position) continue

            const body = this.physicsWorld.getRigidBody(physicsBody.bodyHandle)
            if (!body) continue

            // Get physics body position and rotation
            const translation = body.translation()
            const rotation = body.rotation()

            // Update position component
            position.x = translation.x
            position.y = translation.y
            position.z = translation.z

            // Convert quaternion to Euler angles
            // For ships, we primarily care about Y rotation (yaw)
            const euler = this.quaternionToEuler(rotation)
            position.rotationX = euler.x
            position.rotationY = euler.y
            position.rotationZ = euler.z
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
    }

    removePhysicsBody(bodyHandle: number, colliderHandle: number): void {
        if (!this.initialized || !this.physicsWorld) return

        const body = this.physicsWorld.getRigidBody(bodyHandle)
        const collider = this.physicsWorld.getCollider(colliderHandle)

        if (collider) {
            this.physicsWorld.removeCollider(collider, true)
        }
        if (body) {
            this.physicsWorld.removeRigidBody(body)
        }
    }

    dispose(): void {
        if (this.physicsWorld) {
            this.physicsWorld.free()
        }
    }
}