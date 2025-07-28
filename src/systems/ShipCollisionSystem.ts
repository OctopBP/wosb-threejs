import * as CANNON from 'cannon'
import type {
    EnemyComponent,
    HealthComponent,
    PhysicsBodyComponent,
    PlayerComponent,
    PositionComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { AudioSystem } from './AudioSystem'
import type { PhysicsSystem } from './PhysicsSystem'

export class ShipCollisionSystem extends System {
    private physicsSystem: PhysicsSystem | null = null
    private audioSystem: AudioSystem | null = null
    private collisionDamage = 15 // Damage dealt in ship-to-ship collisions

    constructor(world: World) {
        super(world, [])
    }

    setPhysicsSystem(physicsSystem: PhysicsSystem): void {
        this.physicsSystem = physicsSystem
        this.setupCollisionEventListeners()
    }

    setAudioSystem(audioSystem: AudioSystem): void {
        this.audioSystem = audioSystem
    }

    private setupCollisionEventListeners(): void {
        if (!this.physicsSystem) return

        const physicsWorld = this.physicsSystem.getPhysicsWorld()

        // Listen for collision events
        physicsWorld.addEventListener('beginContact', (event: any) => {
            this.handleShipCollision(event.contact)
        })
    }

    private handleShipCollision(contact: CANNON.ContactEquation): void {
        const bodyA = contact.bi
        const bodyB = contact.bj

        // Find entities that correspond to these physics bodies
        const entityA = this.findEntityByPhysicsBody(bodyA)
        const entityB = this.findEntityByPhysicsBody(bodyB)

        if (!entityA || !entityB) return

        // Only handle ship-to-ship collisions (entities with player or enemy components)
        const isShipA =
            entityA.hasComponent('player') || entityA.hasComponent('enemy')
        const isShipB =
            entityB.hasComponent('player') || entityB.hasComponent('enemy')

        if (!isShipA || !isShipB) return

        // Get collision info
        const healthA = entityA.getComponent('health') as HealthComponent
        const healthB = entityB.getComponent('health') as HealthComponent

        // Skip if either ship is already dead
        if (healthA?.isDead || healthB?.isDead) return

        // Calculate collision force to determine damage multiplier
        const relativeVelocity = new CANNON.Vec3()
        bodyB.velocity.vsub(bodyA.velocity, relativeVelocity)
        const impactSpeed = Math.sqrt(
            relativeVelocity.x * relativeVelocity.x +
                relativeVelocity.y * relativeVelocity.y +
                relativeVelocity.z * relativeVelocity.z,
        )

        // Only process significant collisions (minimum speed threshold)
        if (impactSpeed < 0.5) return

        // Calculate damage based on impact speed
        const baseDamage = this.collisionDamage
        const speedMultiplier = Math.min(impactSpeed / 2, 2) // Cap at 2x damage
        const actualDamage = Math.floor(baseDamage * speedMultiplier)

        // Apply damage to both ships
        if (healthA && !healthA.isDead) {
            this.applyCollisionDamage(entityA, actualDamage)
        }

        if (healthB && !healthB.isDead) {
            this.applyCollisionDamage(entityB, actualDamage)
        }

        // Apply collision effects
        this.applyCollisionEffects(entityA, entityB, impactSpeed)

        // Play collision sound
        this.playCollisionSound(impactSpeed)
    }

    private findEntityByPhysicsBody(body: CANNON.Body): any {
        // Search all entities with physics bodies to find the matching one
        const entitiesWithPhysics = this.world.getEntitiesWithComponents([
            'physicsBody',
        ])

        for (const entity of entitiesWithPhysics) {
            const physicsBody = entity.getComponent(
                'physicsBody',
            ) as PhysicsBodyComponent
            if (physicsBody?.body === body) {
                return entity
            }
        }

        return null
    }

    private applyCollisionDamage(entity: any, damage: number): void {
        const health = entity.getComponent('health') as HealthComponent
        if (!health || health.isDead) return

        // Apply damage
        health.currentHealth = Math.max(0, health.currentHealth - damage)

        // Check if ship died from collision
        if (health.currentHealth <= 0) {
            health.isDead = true

            // Remove alive component
            if (entity.hasComponent('alive')) {
                entity.removeComponent('alive')
            }

            // Stop the physics body
            const physicsBody = entity.getComponent(
                'physicsBody',
            ) as PhysicsBodyComponent
            if (physicsBody?.body) {
                physicsBody.body.velocity.set(0, 0, 0)
                physicsBody.body.angularVelocity.set(0, 0, 0)
            }
        }
    }

    private applyCollisionEffects(
        entityA: any,
        entityB: any,
        impactSpeed: number,
    ): void {
        // Apply a small separation force to prevent ships from getting stuck
        const physicsBodyA = entityA.getComponent(
            'physicsBody',
        ) as PhysicsBodyComponent
        const physicsBodyB = entityB.getComponent(
            'physicsBody',
        ) as PhysicsBodyComponent

        if (physicsBodyA?.body && physicsBodyB?.body) {
            // Calculate separation direction
            const separationForce = new CANNON.Vec3()
            physicsBodyA.body.position.vsub(
                physicsBodyB.body.position,
                separationForce,
            )
            separationForce.normalize()

            // Apply separation impulse proportional to impact speed
            const impulseStrength = impactSpeed * 2
            separationForce.scale(impulseStrength, separationForce)

            // Apply impulses in opposite directions
            physicsBodyA.body.velocity.vadd(
                separationForce,
                physicsBodyA.body.velocity,
            )
            separationForce.scale(-1, separationForce)
            physicsBodyB.body.velocity.vadd(
                separationForce,
                physicsBodyB.body.velocity,
            )

            // Add some random angular velocity for more dynamic collisions
            const randomAngularVelocity =
                (Math.random() - 0.5) * impactSpeed * 0.5
            physicsBodyA.body.angularVelocity.y += randomAngularVelocity
            physicsBodyB.body.angularVelocity.y -= randomAngularVelocity
        }
    }

    private playCollisionSound(impactSpeed: number): void {
        if (!this.audioSystem) return

        // Use hit sound with volume based on impact speed
        const volume = Math.min(impactSpeed / 4, 1.0)
        this.audioSystem.playSfx('death', { volume: volume * 0.7 })
    }

    update(_deltaTime: number): void {
        // This system is event-driven, no per-frame updates needed
    }
}
