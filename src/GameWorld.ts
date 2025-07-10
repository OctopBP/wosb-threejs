import * as BABYLON from 'babylonjs';
import { World } from './ecs/World';
import { InputSystem } from './systems/InputSystem';
import { MovementSystem } from './systems/MovementSystem';
import { RenderSystem } from './systems/RenderSystem';
import { PlayerFactory } from './entities/PlayerFactory';
import { Entity } from './ecs/Entity';

export class GameWorld {
    private world: World;
    private inputSystem: InputSystem;
    private movementSystem: MovementSystem;
    private renderSystem: RenderSystem;
    private playerEntity: Entity | null = null;
    private lastTime: number = 0;

    constructor(private scene: BABYLON.Scene, private canvas: HTMLCanvasElement) {
        this.world = new World();
        
        // Initialize systems
        this.inputSystem = new InputSystem(this.world, canvas);
        this.movementSystem = new MovementSystem(this.world);
        this.renderSystem = new RenderSystem(this.world, scene);

        // Add systems to world
        this.world.addSystem(this.inputSystem);
        this.world.addSystem(this.movementSystem);
        this.world.addSystem(this.renderSystem);
    }

    init(): void {
        console.log('GameWorld: Initializing...');
        
        // Create player ship
        this.playerEntity = PlayerFactory.createPlayerShip();
        this.world.addEntity(this.playerEntity);
        
        console.log(`GameWorld: Created player ship with entity ID ${this.playerEntity.id}`);
        console.log('GameWorld: Controls - WASD/Arrow keys to move, Q/E to rotate, mouse/touch for alternative control');
    }

    update(time: number): void {
        // Calculate delta time
        const deltaTime = this.lastTime === 0 ? 0 : (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Clamp delta time to prevent large jumps
        const clampedDeltaTime = Math.min(deltaTime, 1/30); // Max 30 FPS minimum

        // Update all systems
        this.world.update(clampedDeltaTime);
    }

    getPlayerEntity(): Entity | null {
        return this.playerEntity;
    }

    getEntityCount(): number {
        return this.world.getEntityCount();
    }

    // Configuration methods for tuning movement
    updatePlayerMovementConfig(overrides: any): void {
        if (this.playerEntity) {
            PlayerFactory.updateMovementConfig(this.playerEntity, overrides);
        }
    }

    // Debug methods
    getPlayerPosition(): { x: number, y: number, z: number } | null {
        if (!this.playerEntity) return null;
        
        const position = this.playerEntity.getComponent('position') as any;
        return position ? { x: position.x, y: position.y, z: position.z } : null;
    }

    getPlayerVelocity(): { dx: number, dy: number, dz: number } | null {
        if (!this.playerEntity) return null;
        
        const velocity = this.playerEntity.getComponent('velocity') as any;
        return velocity ? { dx: velocity.dx, dy: velocity.dy, dz: velocity.dz } : null;
    }

    cleanup(): void {
        console.log('GameWorld: Cleaning up...');
        this.world.clear();
        this.playerEntity = null;
    }
}