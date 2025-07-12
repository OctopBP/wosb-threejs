import * as CANNON from 'cannon-es'
import type {
    PhysicsComponent,
    PositionComponent,
    VelocityComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class PhysicsSystem extends System {
    private physicsWorld: CANNON.World
    private bodyEntityMap: Map<CANNON.Body, Entity> = new Map()

    constructor(world: World) {
        super(world, ['physics', 'position', 'velocity'])

        // Initialize cannon-es physics world
        this.physicsWorld = new CANNON.World({
            gravity: new CANNON.Vec3(0, 0, 0), // No gravity for space ships
        })

        // Set up physics world properties
        this.physicsWorld.broadphase = new CANNON.NaiveBroadphase()
        if (this.physicsWorld.solver instanceof CANNON.GSSolver) {
            this.physicsWorld.solver.iterations = 10
        }
        this.physicsWorld.defaultContactMaterial.friction = 0.3
        this.physicsWorld.defaultContactMaterial.restitution = 0.3
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        // Create physics bodies for new entities
        for (const entity of entities) {
            const physics = entity.getComponent<PhysicsComponent>('physics')
            if (physics && !physics.body) {
                this.createPhysicsBody(entity, physics)
            }
        }

        // Update physics world positions before simulation
        this.syncECSToPhysics()

        // Step the physics simulation
        this.physicsWorld.fixedStep(deltaTime)

        // Update ECS positions from physics world
        this.syncPhysicsToECS()
    }

    private createPhysicsBody(entity: Entity, physics: PhysicsComponent): void {
        const position = entity.getComponent<PositionComponent>('position')
        if (!position) return

        // Create collision shape based on component configuration
        let shape: CANNON.Shape
        switch (physics.shape) {
            case 'sphere':
                shape = new CANNON.Sphere(physics.dimensions.radius || 1.0)
                break
            case 'box':
                shape = new CANNON.Box(
                    new CANNON.Vec3(
                        (physics.dimensions.width || 2.0) / 2,
                        (physics.dimensions.height || 1.0) / 2,
                        (physics.dimensions.depth || 2.0) / 2,
                    ),
                )
                break
            case 'cylinder':
                shape = new CANNON.Cylinder(
                    physics.dimensions.radiusTop || 1.0,
                    physics.dimensions.radiusBottom || 1.0,
                    physics.dimensions.height || 2.0,
                    8, // number of segments
                )
                break
            default:
                shape = new CANNON.Sphere(1.0)
                break
        }

        // Create physics body
        const body = new CANNON.Body({
            mass: physics.bodyType === 'static' ? 0 : physics.mass,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            type: this.getCannonBodyType(physics.bodyType),
        })

        // Set material properties if specified
        if (physics.material) {
            body.material = new CANNON.Material({
                friction: physics.material.friction,
                restitution: physics.material.restitution,
            })
        }

        // Add body to physics world
        this.physicsWorld.addBody(body)

        // Store references
        physics.body = body
        this.bodyEntityMap.set(body, entity)
    }

    private getCannonBodyType(bodyType: string): CANNON.BodyType {
        switch (bodyType) {
            case 'static':
                return CANNON.Body.STATIC
            case 'kinematic':
                return CANNON.Body.KINEMATIC
            case 'dynamic':
            default:
                return CANNON.Body.DYNAMIC
        }
    }

    private syncECSToPhysics(): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const physics = entity.getComponent<PhysicsComponent>('physics')
            const position = entity.getComponent<PositionComponent>('position')
            const velocity = entity.getComponent<VelocityComponent>('velocity')

            if (!physics?.body || !position || !velocity) continue

            // Only update kinematic and dynamic bodies from ECS
            if (physics.bodyType !== 'static') {
                // Update position
                physics.body.position.set(position.x, position.y, position.z)

                // Update velocity for dynamic bodies
                if (physics.bodyType === 'dynamic') {
                    physics.body.velocity.set(
                        velocity.dx,
                        velocity.dy,
                        velocity.dz,
                    )
                }

                // Update rotation (if needed in the future)
                // physics.body.quaternion.setFromEuler(position.rotationX, position.rotationY, position.rotationZ)
            }
        }
    }

    private syncPhysicsToECS(): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const physics = entity.getComponent<PhysicsComponent>('physics')
            const position = entity.getComponent<PositionComponent>('position')
            const velocity = entity.getComponent<VelocityComponent>('velocity')

            if (!physics?.body || !position || !velocity) continue

            // Only sync back velocity changes from collisions, let MovementSystem handle positions
            if (physics.bodyType === 'dynamic') {
                // Only update velocity if it was significantly changed by physics (collision response)
                const velDiff =
                    Math.abs(physics.body.velocity.x - velocity.dx) +
                    Math.abs(physics.body.velocity.y - velocity.dy) +
                    Math.abs(physics.body.velocity.z - velocity.dz)

                if (velDiff > 0.1) {
                    // Only update if physics changed velocity significantly
                    velocity.dx = physics.body.velocity.x
                    velocity.dy = physics.body.velocity.y
                    velocity.dz = physics.body.velocity.z
                }

                // If there was a position correction from collision, apply it
                const posDiff =
                    Math.abs(physics.body.position.x - position.x) +
                    Math.abs(physics.body.position.y - position.y) +
                    Math.abs(physics.body.position.z - position.z)

                if (posDiff > 0.01) {
                    // Only update position if significantly different (collision separation)
                    position.x = physics.body.position.x
                    position.y = physics.body.position.y
                    position.z = physics.body.position.z
                }
            }
        }
    }

    // Clean up physics bodies for removed entities
    removeEntityBody(entity: Entity): void {
        const physics = entity.getComponent<PhysicsComponent>('physics')
        if (physics?.body) {
            this.physicsWorld.removeBody(physics.body)
            this.bodyEntityMap.delete(physics.body)
            physics.body = undefined
        }
    }

    // Get the physics world for debugging or advanced features
    getPhysicsWorld(): CANNON.World {
        return this.physicsWorld
    }
}
