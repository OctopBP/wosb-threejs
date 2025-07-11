import { Entity } from './Entity';
import { Component, ComponentClass } from './Component';

export interface ISystem {
    update(deltaTime: number): void;
    onStart?(): void;
    onStop?(): void;
}

export class World {
    private entities = new Map<number, Entity>();
    private systems: ISystem[] = [];
    
    createEntity(): Entity {
        const entity = new Entity();
        this.entities.set(entity.id, entity);
        return entity;
    }
    
    getEntity(id: number): Entity | undefined {
        return this.entities.get(id);
    }
    
    removeEntity(id: number): boolean {
        return this.entities.delete(id);
    }
    
    getAllEntities(): Entity[] {
        return Array.from(this.entities.values());
    }
    
    getEntitiesWith<T extends Component>(...componentTypes: ComponentClass<T>[]): Entity[] {
        return this.getAllEntities().filter(entity => 
            componentTypes.every(type => entity.hasComponent(type))
        );
    }
    
    addSystem(system: ISystem): void {
        this.systems.push(system);
        if (system.onStart) {
            system.onStart();
        }
    }
    
    removeSystem(system: ISystem): boolean {
        const index = this.systems.indexOf(system);
        if (index !== -1) {
            if (system.onStop) {
                system.onStop();
            }
            this.systems.splice(index, 1);
            return true;
        }
        return false;
    }
    
    update(deltaTime: number): void {
        for (const system of this.systems) {
            system.update(deltaTime);
        }
    }
}