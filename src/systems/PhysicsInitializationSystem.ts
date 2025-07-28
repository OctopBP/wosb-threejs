import type {
    PhysicsColliderComponent,
    PhysicsComponent,
    PositionComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { PhysicsSystem } from './PhysicsSystem'

export class PhysicsInitializationSystem extends System {
    private physicsSystem: PhysicsSystem | null = null

    constructor(world: World) {
        super(world, ['position'])
    }

    setPhysicsSystem(physicsSystem: PhysicsSystem): void {
        this.physicsSystem = physicsSystem
    }

    update(_deltaTime: number): void {
        if (!this.physicsSystem) return

        const entities = this.getEntities()

        for (const entity of entities) {
            // Skip entities that already have physics components
            if (entity.hasComponent('physics')) continue

            const position = entity.getComponent<PositionComponent>('position')
            if (!position) continue

            // Determine rigid body type based on entity type
            let rigidBodyType: 'dynamic' | 'kinematic' | 'fixed' = 'dynamic'
            let mass = 1.0
            let linearDamping = 0.5 // Higher damping for ships on water
            let angularDamping = 0.8 // Higher angular damping for realistic ship movement

            if (entity.hasComponent('player') || entity.hasComponent('enemy')) {
                // Ships are dynamic bodies that can be affected by forces
                rigidBodyType = 'dynamic'
                mass = entity.hasComponent('player') ? 2.0 : 1.5 // Player ship slightly heavier
                linearDamping = 0.6 // Ship drag on water
                angularDamping = 0.9 // Ships turn more slowly
            } else if (entity.hasComponent('projectile')) {
                // Projectiles are dynamic but lighter
                rigidBodyType = 'dynamic'
                mass = 0.1
                linearDamping = 0.1 // Less drag for projectiles
                angularDamping = 0.2
            }

            // Create rigid body
            const rigidBodyHandle = this.physicsSystem.createRigidBody(
                position,
                rigidBodyType,
                mass,
                0.1, // restitution
                0.3, // friction
                linearDamping,
                angularDamping,
            )

            if (rigidBodyHandle === null) continue

            // Add physics component
            entity.addComponent<PhysicsComponent>({
                type: 'physics',
                rigidBodyHandle,
                rigidBodyType,
                mass,
                restitution: 0.1,
                friction: 0.3,
                linearDamping,
                angularDamping,
            })

            // Create appropriate collider based on entity type
            let colliderHandle: number | null = null

            if (entity.hasComponent('player') || entity.hasComponent('enemy')) {
                // Ships get box colliders
                colliderHandle = this.physicsSystem.createCollider(
                    rigidBodyHandle,
                    'box',
                    { width: 2.0, height: 1.0, depth: 4.0 }, // Ship-like dimensions
                    false, // Not a sensor
                    undefined, // No offset
                    0.1, // restitution
                    0.3, // friction
                )
            } else if (entity.hasComponent('projectile')) {
                // Projectiles get sphere colliders
                colliderHandle = this.physicsSystem.createCollider(
                    rigidBodyHandle,
                    'sphere',
                    { radius: 0.2 },
                    false, // Not a sensor
                    undefined, // No offset
                    0.8, // Higher restitution for projectiles
                    0.1, // Lower friction
                )
            }

            if (colliderHandle !== null) {
                entity.addComponent<PhysicsColliderComponent>({
                    type: 'physicsCollider',
                    colliderHandle,
                    colliderType:
                        entity.hasComponent('player') ||
                        entity.hasComponent('enemy')
                            ? 'box'
                            : 'sphere',
                    dimensions:
                        entity.hasComponent('player') ||
                        entity.hasComponent('enemy')
                            ? { width: 2.0, height: 1.0, depth: 4.0 }
                            : { radius: 0.2 },
                    isSensor: false,
                })
            }
        }
    }
}
