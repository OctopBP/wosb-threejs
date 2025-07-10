import { Component } from './Component';

export type EntityId = number;

export class Entity {
    private static nextId: EntityId = 1;
    public readonly id: EntityId;
    private components: Map<string, Component> = new Map();

    constructor() {
        this.id = Entity.nextId++;
    }

    // Add a component to this entity
    addComponent<T extends Component>(component: T): void {
        this.components.set(component.type, component);
    }

    // Get a component by type
    getComponent<T extends Component>(type: string): T | undefined {
        return this.components.get(type) as T;
    }

    // Check if entity has a component
    hasComponent(type: string): boolean {
        return this.components.has(type);
    }

    // Check if entity has all the specified component types
    hasComponents(types: string[]): boolean {
        return types.every(type => this.hasComponent(type));
    }

    // Remove a component by type
    removeComponent(type: string): void {
        this.components.delete(type);
    }

    // Get all components
    getAllComponents(): Component[] {
        return Array.from(this.components.values());
    }

    // Get all component types
    getComponentTypes(): string[] {
        return Array.from(this.components.keys());
    }

    // Clear all components
    clear(): void {
        this.components.clear();
    }
}