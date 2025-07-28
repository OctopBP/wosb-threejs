import RAPIER from '@dimforge/rapier3d'
import type {
    PhysicsColliderComponent,
    PhysicsComponent,
    PhysicsForceComponent,
    PositionComponent,
    VelocityComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class PhysicsSystem extends System {
    private physicsWorld: RAPIER.World | null = null
    private gravity = { x: 0.0, y: 0.0, z: 0.0 }
    private initialized = false

    constructor(world: World) {
        super(world, [])
        this.initializePhysics()
    }

    private async initializePhysics(): Promise<void> {
        try {
            this.physicsWorld = new RAPIER.World(this.gravity)
            this.initialized = true
        } catch (error) {
            console.error('Failed to initialize Rapier physics:', error)
        }
    }

    getRapierWorld(): RAPIER.World | null {
        return this.physicsWorld
    }

    update(deltaTime: number): void {
        if (!this.initialized || !this.physicsWorld) return

        this.applyForces()
        this.physicsWorld.step()
        this.syncPhysicsToComponents()
    }

    private applyForces(): void {
        if (!this.physicsWorld) return

        const entitiesWithForces = this.world.getEntitiesWithComponents([
            'physics',
            'physicsForce',
        ])

        for (const entity of entitiesWithForces) {
            const physics = entity.getComponent<PhysicsComponent>('physics')
            const forceComp =
                entity.getComponent<PhysicsForceComponent>('physicsForce')

            if (!physics || !forceComp) continue

            const rigidBody = this.physicsWorld.getRigidBody(
                physics.rigidBodyHandle,
            )
            if (!rigidBody) continue

            // Apply force
            if (
                forceComp.force.x !== 0 ||
                forceComp.force.y !== 0 ||
                forceComp.force.z !== 0
            ) {
                if (forceComp.applyAtCenterOfMass) {
                    rigidBody.addForce(forceComp.force, true)
                } else {
                    rigidBody.addForceAtPoint(
                        forceComp.force,
                        rigidBody.translation(),
                        true,
                    )
                }
            }

            // Apply torque
            if (
                forceComp.torque.x !== 0 ||
                forceComp.torque.y !== 0 ||
                forceComp.torque.z !== 0
            ) {
                rigidBody.addTorque(forceComp.torque, true)
            }

            // Reset forces after applying them
            forceComp.force = { x: 0, y: 0, z: 0 }
            forceComp.torque = { x: 0, y: 0, z: 0 }
        }
    }

    private syncPhysicsToComponents(): void {
        if (!this.physicsWorld) return

        const physicsEntities = this.world.getEntitiesWithComponents([
            'physics',
            'position',
        ])

        for (const entity of physicsEntities) {
            const physics = entity.getComponent<PhysicsComponent>('physics')
            const position = entity.getComponent<PositionComponent>('position')

            if (!physics || !position) continue

            const rigidBody = this.physicsWorld.getRigidBody(
                physics.rigidBodyHandle,
            )
            if (!rigidBody) continue

            // Sync position
            const translation = rigidBody.translation()
            position.x = translation.x
            position.y = translation.y
            position.z = translation.z

            // Sync rotation
            const rotation = rigidBody.rotation()
            // Convert quaternion to Euler angles (Y rotation for ship turning)
            const euler = this.quaternionToEuler(rotation)
            position.rotationX = euler.x
            position.rotationY = euler.y
            position.rotationZ = euler.z

            // Sync velocity if entity has velocity component
            if (entity.hasComponent('velocity')) {
                const velocity =
                    entity.getComponent<VelocityComponent>('velocity')
                if (velocity) {
                    const linvel = rigidBody.linvel()
                    const angvel = rigidBody.angvel()

                    velocity.dx = linvel.x
                    velocity.dy = linvel.y
                    velocity.dz = linvel.z
                    velocity.angularVelocityX = angvel.x
                    velocity.angularVelocityY = angvel.y
                    velocity.angularVelocityZ = angvel.z
                }
            }
        }
    }

    createRigidBody(
        position: PositionComponent,
        rigidBodyType: 'dynamic' | 'kinematic' | 'fixed' = 'dynamic',
        mass = 1.0,
        restitution = 0.1,
        friction = 0.5,
        linearDamping = 0.1,
        angularDamping = 0.1,
    ): number | null {
        if (!this.initialized || !this.physicsWorld) return null

        let rigidBodyDesc: RAPIER.RigidBodyDesc

        switch (rigidBodyType) {
            case 'dynamic':
                rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
                break
            case 'kinematic':
                rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased()
                break
            case 'fixed':
                rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
                break
        }

        rigidBodyDesc
            .setTranslation(position.x, position.y, position.z)
            .setRotation({
                w: Math.cos(position.rotationY / 2),
                x: 0,
                y: Math.sin(position.rotationY / 2),
                z: 0,
            })
            .setLinearDamping(linearDamping)
            .setAngularDamping(angularDamping)

        const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc)

        return rigidBody.handle
    }

    createCollider(
        rigidBodyHandle: number,
        colliderType: 'box' | 'sphere' | 'capsule' | 'cylinder',
        dimensions: {
            width?: number
            height?: number
            depth?: number
            radius?: number
        },
        isSensor = false,
        offset?: { x: number; y: number; z: number },
        restitution = 0.1,
        friction = 0.5,
    ): number | null {
        if (!this.initialized || !this.physicsWorld) return null

        const rigidBody = this.physicsWorld.getRigidBody(rigidBodyHandle)
        if (!rigidBody) return null

        let colliderDesc: RAPIER.ColliderDesc

        switch (colliderType) {
            case 'box':
                colliderDesc = RAPIER.ColliderDesc.cuboid(
                    (dimensions.width || 1) / 2,
                    (dimensions.height || 1) / 2,
                    (dimensions.depth || 1) / 2,
                )
                break
            case 'sphere':
                colliderDesc = RAPIER.ColliderDesc.ball(
                    dimensions.radius || 0.5,
                )
                break
            case 'capsule':
                colliderDesc = RAPIER.ColliderDesc.capsule(
                    (dimensions.height || 1) / 2,
                    dimensions.radius || 0.5,
                )
                break
            case 'cylinder':
                colliderDesc = RAPIER.ColliderDesc.cylinder(
                    (dimensions.height || 1) / 2,
                    dimensions.radius || 0.5,
                )
                break
        }

        if (offset) {
            colliderDesc.setTranslation(offset.x, offset.y, offset.z)
        }

        colliderDesc.setRestitution(restitution).setFriction(friction)

        if (isSensor) {
            colliderDesc.setSensor(true)
        }

        const collider = this.physicsWorld.createCollider(
            colliderDesc,
            rigidBody,
        )

        return collider.handle
    }

    removeRigidBody(rigidBodyHandle: number): void {
        if (!this.initialized || !this.physicsWorld) return

        const rigidBody = this.physicsWorld.getRigidBody(rigidBodyHandle)
        if (rigidBody) {
            this.physicsWorld.removeRigidBody(rigidBody)
        }
    }

    removeCollider(colliderHandle: number): void {
        if (!this.initialized || !this.physicsWorld) return

        const collider = this.physicsWorld.getCollider(colliderHandle)
        if (collider) {
            this.physicsWorld.removeCollider(collider, true)
        }
    }

    private quaternionToEuler(q: {
        w: number
        x: number
        y: number
        z: number
    }): { x: number; y: number; z: number } {
        const sinrCosp = 2 * (q.w * q.x + q.y * q.z)
        const cosrCosp = 1 - 2 * (q.x * q.x + q.y * q.y)
        const x = Math.atan2(sinrCosp, cosrCosp)

        const sinp = 2 * (q.w * q.y - q.z * q.x)
        const y =
            Math.abs(sinp) >= 1
                ? Math.sign(sinp) * (Math.PI / 2)
                : Math.asin(sinp)

        const sinyCosp = 2 * (q.w * q.z + q.x * q.y)
        const cosyCosp = 1 - 2 * (q.y * q.y + q.z * q.z)
        const z = Math.atan2(sinyCosp, cosyCosp)

        return { x, y, z }
    }
}
