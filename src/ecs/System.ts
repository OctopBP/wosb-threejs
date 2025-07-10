import type { Entity } from './Entity'
import type { World } from './World'

// Base System class
export abstract class System {
    protected world: World
    public readonly requiredComponents: string[]

    constructor(world: World, requiredComponents: string[] = []) {
        this.world = world
        this.requiredComponents = requiredComponents
    }

    // Get all entities that have the required components for this system
    getEntities(): Entity[] {
        return this.world.getEntitiesWithComponents(this.requiredComponents)
    }

    // Abstract update method to be implemented by each system
    abstract update(deltaTime: number): void

    // Optional init method for system setup
    init(): void {}

    // Optional cleanup method
    cleanup(): void {}
}
