import { Vector3 } from 'three'
import type { ParticleComponent, PositionComponent } from '../ecs/Component'
import { Entity } from '../ecs/Entity'
import type { World } from '../ecs/World'

export interface CreateParticleEffectOptions {
    systemType: ParticleComponent['systemType']
    position: Vector3
    duration?: number
    intensity?: number
    autoDestroy?: boolean
}

/**
 * Creates a new entity with particle and position components for one-time effects
 */
export function createParticleEffect(options: CreateParticleEffectOptions): Entity {
    const entity = new Entity()

    // Add position component
    const positionComponent: PositionComponent = {
        type: 'position',
        x: options.position.x,
        y: options.position.y,
        z: options.position.z,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
    }
    entity.addComponent(positionComponent)

    // Add particle component
    const particleComponent: ParticleComponent = {
        type: 'particle',
        systemType: options.systemType,
        active: true,
        duration: options.duration,
        intensity: options.intensity || 1.0,
        autoDestroy: options.autoDestroy ?? true,
    }
    entity.addComponent(particleComponent)

    return entity
}

/**
 * Adds a particle component to an existing entity
 */
export function addParticleEffect(
    entity: Entity,
    systemType: ParticleComponent['systemType'],
    options: {
        duration?: number
        intensity?: number
        autoDestroy?: boolean
    } = {}
): void {
    // Remove existing particle component if present
    const existingParticle = entity.getComponent<ParticleComponent>('particle')
    if (existingParticle) {
        entity.removeComponent('particle')
    }

    // Add new particle component
    const particleComponent: ParticleComponent = {
        type: 'particle',
        systemType,
        active: true,
        duration: options.duration,
        intensity: options.intensity || 1.0,
        autoDestroy: options.autoDestroy ?? false, // Don't auto-destroy existing entities by default
    }
    entity.addComponent(particleComponent)
}

/**
 * Removes particle effect from an entity
 */
export function removeParticleEffect(entity: Entity): void {
    entity.removeComponent('particle')
}

/**
 * Creates a temporary explosion effect at the given position
 */
export function createExplosionEffect(
    world: World,
    position: Vector3,
    intensity: number = 1.0
): void {
    const explosionEntity = createParticleEffect({
        systemType: 'explosion',
        position,
        intensity,
        autoDestroy: true,
    })
    world.addEntity(explosionEntity)
}

/**
 * Creates a temporary impact effect at the given position
 */
export function createImpactEffect(
    world: World,
    position: Vector3,
    intensity: number = 1.0
): void {
    const impactEntity = createParticleEffect({
        systemType: 'impact',
        position,
        intensity,
        autoDestroy: true,
    })
    world.addEntity(impactEntity)
}

/**
 * Creates a temporary muzzle flash effect at the given position
 */
export function createMuzzleFlashEffect(
    world: World,
    position: Vector3,
    intensity: number = 1.0
): void {
    const muzzleFlashEntity = createParticleEffect({
        systemType: 'muzzleFlash',
        position,
        intensity,
        autoDestroy: true,
    })
    world.addEntity(muzzleFlashEntity)
}

/**
 * Creates a temporary damage effect at the given position
 */
export function createDamageEffect(
    world: World,
    position: Vector3,
    intensity: number = 1.0
): void {
    const damageEntity = createParticleEffect({
        systemType: 'damage',
        position,
        intensity,
        autoDestroy: true,
    })
    world.addEntity(damageEntity)
}

/**
 * Creates a temporary death effect at the given position
 */
export function createDeathEffect(
    world: World,
    position: Vector3,
    intensity: number = 1.0
): void {
    const deathEntity = createParticleEffect({
        systemType: 'death',
        position,
        intensity,
        autoDestroy: true,
    })
    world.addEntity(deathEntity)
}

/**
 * Adds continuous thrust particles to an entity (like a ship)
 */
export function addThrustEffect(entity: Entity, intensity: number = 1.0): void {
    addParticleEffect(entity, 'thrust', {
        intensity,
        autoDestroy: false, // Keep thrust running
    })
}

/**
 * Removes thrust effect from an entity
 */
export function removeThrustEffect(entity: Entity): void {
    removeParticleEffect(entity)
}