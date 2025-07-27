import * as CANNON from 'cannon'
import type {
    CollisionComponent,
    PhysicsBodyComponent,
    PositionComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class PhysicsSystem extends System {
    private physicsWorld: CANNON.World
    private fixedTimeStep = 1 / 60
    private accumulator = 0

    constructor(world: World) {
        super(world, ['physicsBody', 'position'])

        // Initialize Cannon.js physics world
        this.physicsWorld = new CANNON.World()
        this.physicsWorld.gravity.set(0, 0, 0) // No gravity for ship game
        this.physicsWorld.broadphase = new CANNON.NaiveBroadphase()
        this.physicsWorld.solver.iterations = 10

        // Add contact material for ship collisions
        const shipMaterial = new CANNON.Material('ship')
        const shipContactMaterial = new CANNON.ContactMaterial(
            shipMaterial,
            shipMaterial,
            {
                friction: 0.1,
                restitution: 0.8, // Bouncy collisions
            },
        )
        this.physicsWorld.addContactMaterial(shipContactMaterial)
    }

    update(deltaTime: number): void {
        // Fixed timestep physics integration
        this.accumulator += deltaTime

        while (this.accumulator >= this.fixedTimeStep) {
            this.physicsWorld.step(this.fixedTimeStep)
            this.accumulator -= this.fixedTimeStep
        }

        // Sync physics bodies with ECS entities
        this.syncPhysicsToEntities()
    }

    private syncPhysicsToEntities(): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const physicsBody =
                entity.getComponent<PhysicsBodyComponent>('physicsBody')
            const position = entity.getComponent<PositionComponent>('position')

            if (!physicsBody?.body || !position) continue

            // Update entity position from physics body
            position.x = physicsBody.body.position.x
            position.y = physicsBody.body.position.y
            position.z = physicsBody.body.position.z

            // Update entity rotation from physics body (convert quaternion to euler)
            const quaternion = physicsBody.body.quaternion
            position.rotationY = Math.atan2(
                2 * (quaternion.w * quaternion.y + quaternion.x * quaternion.z),
                1 -
                    2 *
                        (quaternion.y * quaternion.y +
                            quaternion.z * quaternion.z),
            )
        }
    }

    /**
     * Create a physics body for an entity based on its collision component
     */
    createPhysicsBody(
        entity: any,
        mass: number = 1,
        isStatic: boolean = false,
    ): void {
        const position = entity.getComponent('position') as PositionComponent
        const collision = entity.getComponent('collision') as CollisionComponent

        if (!position || !collision) return

        let shape: CANNON.Shape
        let bodyShape: 'box' | 'sphere'

        // Create physics shape based on collision component
        if (collision.collider.shape === 'box') {
            shape = new CANNON.Box(
                new CANNON.Vec3(
                    collision.collider.width / 2,
                    collision.collider.height / 2,
                    collision.collider.depth / 2,
                ),
            )
            bodyShape = 'box'
        } else {
            shape = new CANNON.Sphere(collision.collider.radius)
            bodyShape = 'sphere'
        }

        // Create physics body
        const body = new CANNON.Body({
            mass: isStatic ? 0 : mass,
        }) as any
        body.addShape(shape)
        body.position.set(position.x, position.y, position.z)

        // Set initial rotation (set Y rotation directly)
        body.quaternion
            .set(
                0,
                Math.sin(position.rotationY / 2),
                0,
                Math.cos(position.rotationY / 2),
            )(
                // Add to physics world
                this.physicsWorld as any,
            )
            .add(body)

        // Add physics component to entity
        entity.addComponent({
            type: 'physicsBody',
            body: body,
            shape: bodyShape,
            mass: mass,
            isStatic: isStatic,
        } as PhysicsBodyComponent)
    }

    /**
     * Remove physics body from world when entity is removed
     */
    removePhysicsBody(entity: any): void {
        const physicsBody = entity.getComponent(
            'physicsBody',
        ) as PhysicsBodyComponent
        if (physicsBody?.body) {
            ;(this.physicsWorld as any).remove(physicsBody.body)
            entity.removeComponent('physicsBody')
        }
    }

    /**
     * Apply force to physics body (for movement)
     */
    applyForce(entity: any, force: { x: number; y: number; z: number }): void {
        const physicsBody = entity.getComponent(
            'physicsBody',
        ) as PhysicsBodyComponent
        if (physicsBody?.body) {
            physicsBody.body.force.set(force.x, force.y, force.z)
        }
    }

    /**
     * Apply impulse to physics body (for instant velocity change)
     */
    applyImpulse(
        entity: any,
        impulse: { x: number; y: number; z: number },
    ): void {
        const physicsBody = entity.getComponent(
            'physicsBody',
        ) as PhysicsBodyComponent
        if (physicsBody?.body) {
            physicsBody.body.velocity.set(
                physicsBody.body.velocity.x + impulse.x,
                physicsBody.body.velocity.y + impulse.y,
                physicsBody.body.velocity.z + impulse.z,
            )
        }
    }

    /**
     * Set velocity directly on physics body
     */
    setVelocity(
        entity: any,
        velocity: { x: number; y: number; z: number },
    ): void {
        const physicsBody = entity.getComponent(
            'physicsBody',
        ) as PhysicsBodyComponent
        if (physicsBody?.body) {
            physicsBody.body.velocity.set(velocity.x, velocity.y, velocity.z)
        }
    }

    /**
     * Get the physics world for advanced operations
     */
    getPhysicsWorld(): CANNON.World {
        return this.physicsWorld
    }
}
