import { World, ISystem } from './World';

export abstract class System implements ISystem {
    protected world: World;
    
    constructor(world: World) {
        this.world = world;
    }
    
    abstract update(deltaTime: number): void;
    
    // Optional lifecycle methods
    onStart?(): void;
    onStop?(): void;
}