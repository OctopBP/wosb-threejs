import type { PerspectiveCamera, Scene } from 'three'
import type { World } from '../ecs/World'
import type { ParticleFactory } from '../entities/ParticleFactory'
import { ParticleSystem } from '../systems/ParticleSystem'

/**
 * Example showing how to integrate the particle system into your existing game
 *
 * This example demonstrates:
 * 1. Adding the ParticleSystem to GameWorld
 * 2. Creating a ParticleFactory instance
 * 3. Using particle effects in response to game events
 */

// 1. First, add the particle system to your GameWorld.ts class:

/*
// In GameWorld.ts, add these imports:
import { ParticleSystem } from './systems/ParticleSystem'
import { ParticleFactory } from './entities/ParticleFactory'

// Add private fields to the GameWorld class:
export class GameWorld {
    // ... existing fields
    private particleSystem: ParticleSystem
    private particleFactory: ParticleFactory

    constructor(
        scene: Scene,
        camera: PerspectiveCamera,
        canvas: HTMLCanvasElement,
        gameStateConfig: GameStateConfig = defaultGameStateConfig,
    ) {
        // ... existing initialization code

        // Initialize particle system (add after other systems)
        this.particleSystem = new ParticleSystem(this.world, scene)
        this.particleFactory = new ParticleFactory(this.world)

        // ... existing system setup

        // Add particle system to update loop (add before renderSystem)
        this.world.addSystem(this.particleSystem) // Add around position 17
        this.world.addSystem(this.renderSystem) // 18. Render the results
    }

    // Add getter method to access particle factory from other systems
    getParticleFactory(): ParticleFactory {
        return this.particleFactory
    }
}
*/

// 2. Example of using particles in CollisionSystem.ts:

export class ExampleCollisionSystemWithParticles {
    private world: World
    private particleFactory: ParticleFactory

    constructor(world: World, particleFactory: ParticleFactory) {
        this.world = world
        this.particleFactory = particleFactory
    }

    // Example: Add particle effects when projectiles hit enemies
    handleProjectileHit(projectilePosition: {
        x: number
        y: number
        z: number
    }) {
        // Create sparks on impact
        this.particleFactory.createSparks(projectilePosition)

        // Create small explosion
        this.particleFactory.createExplosion(projectilePosition, 'small')
    }

    // Example: Add particle effects when enemies die
    handleEnemyDestruction(enemyPosition: { x: number; y: number; z: number }) {
        // Create medium explosion
        this.particleFactory.createExplosion(enemyPosition, 'medium')

        // Create debris
        this.particleFactory.createDebris(enemyPosition, 'normal')

        // Add smoke effect after a brief delay
        setTimeout(() => {
            this.particleFactory.createSmoke(enemyPosition)
        }, 300)
    }

    // Example: Add blood effect when player takes damage
    handlePlayerDamage(playerPosition: { x: number; y: number; z: number }) {
        this.particleFactory.createBloodEffect(playerPosition)
    }
}

// 3. Example of using particles in WeaponSystem.ts:

export class ExampleWeaponSystemWithParticles {
    private world: World
    private particleFactory: ParticleFactory

    constructor(world: World, particleFactory: ParticleFactory) {
        this.world = world
        this.particleFactory = particleFactory
    }

    // Example: Add muzzle flash when firing weapons
    handleWeaponFire(weaponPosition: { x: number; y: number; z: number }) {
        // Create small sparks as muzzle flash
        this.particleFactory.createSparks(weaponPosition)
    }

    // Example: Add particle trail to projectiles
    createProjectileWithTrail(startPosition: {
        x: number
        y: number
        z: number
    }) {
        // Create your projectile entity as usual
        const projectileEntity = this.world.createEntity()

        // Add position, velocity, projectile components...
        // (your existing projectile creation code)

        // Add particle trail
        this.particleFactory.createProjectileTrail(projectileEntity)

        return projectileEntity
    }
}

// 4. Example of environmental effects:

export class ExampleEnvironmentalEffects {
    private particleFactory: ParticleFactory

    constructor(particleFactory: ParticleFactory) {
        this.particleFactory = particleFactory
    }

    // Create a damaged building with smoke
    createDamagedBuilding(
        world: World,
        position: { x: number; y: number; z: number },
    ) {
        const building = world.createEntity()

        // Add your building components (position, renderable, etc.)
        // ... building setup code

        // Add continuous smoke effect
        this.particleFactory.addParticleEmitterToEntity(building, 'smoke')

        return building
    }

    // Create a campfire
    createCampfire(
        world: World,
        position: { x: number; y: number; z: number },
    ) {
        const campfire = world.createEntity()

        // Add your campfire components
        // ... campfire setup code

        // Add fire and smoke effects
        this.particleFactory.addParticleEmitterToEntity(campfire, 'fire')
        this.particleFactory.addParticleEmitterToEntity(campfire, 'smoke')

        return campfire
    }

    // Create healing zone
    createHealingZone(position: { x: number; y: number; z: number }) {
        return this.particleFactory.createHealingEffect(position)
    }
}

// 5. Example of player abilities with particles:

export class ExamplePlayerAbilities {
    private particleFactory: ParticleFactory

    constructor(particleFactory: ParticleFactory) {
        this.particleFactory = particleFactory
    }

    // Healing ability
    useHealingAbility(playerPosition: { x: number; y: number; z: number }) {
        // Create healing particle effect
        const healingEffect =
            this.particleFactory.createHealingEffect(playerPosition)

        // Apply actual healing logic
        // ... your healing code here

        return healingEffect
    }

    // Shield ability
    activateShield(playerPosition: { x: number; y: number; z: number }) {
        // Create magical shield effect
        const shieldEffect =
            this.particleFactory.createMagicEffect(playerPosition)

        // Apply shield logic
        // ... your shield code here

        return shieldEffect
    }

    // Special attack
    performSpecialAttack(targetPosition: { x: number; y: number; z: number }) {
        // Create large explosion
        const explosion = this.particleFactory.createExplosion(
            targetPosition,
            'large',
        )

        // Create additional effects
        this.particleFactory.createSparks(targetPosition)

        // Apply damage logic
        // ... your attack code here

        return explosion
    }
}

// 6. Example integration in main game file:

export function exampleGameInitialization(
    scene: Scene,
    camera: PerspectiveCamera,
    canvas: HTMLCanvasElement,
) {
    // This shows how you might use the particle system in your main game
    // Initialize your GameWorld (which now includes particle system)
    // const gameWorld = new GameWorld(scene, camera, canvas)
    // Get particle factory from game world
    // const particleFactory = gameWorld.getParticleFactory()
    // Create some environmental effects
    // const environmentalEffects = new ExampleEnvironmentalEffects(particleFactory)
    // Create a campfire at position (5, 0, 5)
    // environmentalEffects.createCampfire(gameWorld.getWorld(), { x: 5, y: 0, z: 5 })
    // Create a damaged building with smoke at position (-3, 0, -3)
    // environmentalEffects.createDamagedBuilding(gameWorld.getWorld(), { x: -3, y: 0, z: -3 })
    // Set up player abilities
    // const playerAbilities = new ExamplePlayerAbilities(particleFactory)
    // Example: Use healing ability when player presses 'H' key
    // document.addEventListener('keydown', (event) => {
    //     if (event.key === 'h' || event.key === 'H') {
    //         const playerEntity = gameWorld.getPlayerEntity()
    //         if (playerEntity) {
    //             const position = playerEntity.getComponent('position')
    //             if (position) {
    //                 playerAbilities.useHealingAbility({
    //                     x: position.x,
    //                     y: position.y,
    //                     z: position.z
    //                 })
    //             }
    //         }
    //     }
    // })
}

// 7. Performance optimization example:

export class ParticlePerformanceManager {
    private particleFactory: ParticleFactory
    private isLowPerformanceMode: boolean = false

    constructor(particleFactory: ParticleFactory) {
        this.particleFactory = particleFactory
    }

    setLowPerformanceMode(enabled: boolean) {
        this.isLowPerformanceMode = enabled
    }

    // Create explosion with performance scaling
    createOptimizedExplosion(
        position: { x: number; y: number; z: number },
        intensity: 'small' | 'medium' | 'large',
    ) {
        if (this.isLowPerformanceMode) {
            // Reduce particle count for better performance
            const reductions = {
                small: { particleCount: 15, maxParticles: 30 },
                medium: { particleCount: 25, maxParticles: 50 },
                large: { particleCount: 50, maxParticles: 100 },
            }

            return this.particleFactory.createParticleEffect(
                'explosion',
                position,
                reductions[intensity],
            )
        } else {
            // Use full quality
            return this.particleFactory.createExplosion(position, intensity)
        }
    }
}
