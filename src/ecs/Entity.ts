import { Component, ComponentClass } from './Component';

export class Entity {
    private static nextId = 1;
    
    readonly id: number;
    private components = new Map<ComponentClass, Component>();
    
    constructor() {
        this.id = Entity.nextId++;
    }
    
    addComponent<T extends Component>(ComponentType: ComponentClass<T>, ...args: any[]): T {
        const component = new ComponentType(this.id, ...args);
        this.components.set(ComponentType, component);
        return component;
    }
    
    getComponent<T extends Component>(ComponentType: ComponentClass<T>): T | undefined {
        return this.components.get(ComponentType) as T | undefined;
    }
    
    hasComponent(ComponentType: ComponentClass): boolean {
        return this.components.has(ComponentType);
    }
    
    removeComponent(ComponentType: ComponentClass): boolean {
        return this.components.delete(ComponentType);
    }
    
    getAllComponents(): Component[] {
        return Array.from(this.components.values());
    }
}