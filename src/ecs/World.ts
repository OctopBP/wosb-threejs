import { Entity, type EntityId } from './Entity'
import type { System } from './System'

export class World {
    private entities: Map<EntityId, Entity> = new Map()
    private systems: System[] = []

    // Add an entity to the world
    addEntity(entity: Entity): void {
        this.entities.set(entity.id, entity)
    }

    // Remove an entity from the world
    removeEntity(entityId: EntityId): void {
        this.entities.delete(entityId)
    }

    // Get an entity by ID
    getEntity(entityId: EntityId): Entity | undefined {
        return this.entities.get(entityId)
    }

    // Get all entities
    getAllEntities(): Entity[] {
        return Array.from(this.entities.values())
    }

    // Get entities that have all the specified component types
    getEntitiesWithComponents(componentTypes: string[]): Entity[] {
        if (componentTypes.length === 0) {
            return this.getAllEntities()
        }

        return this.getAllEntities().filter((entity) =>
            entity.hasComponents(componentTypes),
        )
    }

    // Get entities that have a specific component type
    getEntitiesWithComponent(componentType: string): Entity[] {
        return this.getAllEntities().filter((entity) =>
            entity.hasComponent(componentType),
        )
    }

    // Add a system to the world
    addSystem(system: System): void {
        this.systems.push(system)
        system.init()
    }

    // Update all systems
    update(deltaTime: number): void {
        for (const system of this.systems) {
            system.update(deltaTime)
        }
    }

    // Create a new entity and add it to the world
    createEntity(): Entity {
        const entity = new Entity()
        this.addEntity(entity)
        return entity
    }

    // Clear all entities and systems
    clear(): void {
        // Cleanup systems
        for (const system of this.systems) {
            system.cleanup()
        }

        this.entities.clear()
        this.systems = []
    }

    // Get entity count
    getEntityCount(): number {
        return this.entities.size
    }
}
