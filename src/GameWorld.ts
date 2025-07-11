import * as BABYLON from 'babylonjs';
import { World } from './ecs/World';
import { LevelingSystem, LevelUpEvent } from './systems/LevelingSystem';
import { PlayerFactory } from './entities/PlayerFactory';
import { Entity } from './ecs/Entity';
import { XPComponent } from './components/XPComponent';
import { ShipStatsComponent } from './components/ShipStatsComponent';
import { VisualUpgradeComponent } from './components/VisualUpgradeComponent';
import { LevelingCalculator } from './config/LevelingConfig';

export class GameWorld {
    private world: World;
    private levelingSystem: LevelingSystem;
    private scene: BABYLON.Scene;
    private playerEntity: Entity | null = null;
    private lastTime = 0;
    
    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.world = new World();
        this.levelingSystem = new LevelingSystem(this.world);
        
        // Add the leveling system to the world
        this.world.addSystem(this.levelingSystem);
        
        // Setup level up callbacks for visual and audio feedback
        this.setupLevelUpEffects();
        
        // Register the update loop
        this.scene.registerBeforeRender(() => {
            this.update();
        });
    }
    
    private setupLevelUpEffects(): void {
        this.levelingSystem.onLevelUp((event: LevelUpEvent) => {
            this.handleLevelUp(event);
        });
    }
    
    private handleLevelUp(event: LevelUpEvent): void {
        console.log(`🎉 Level Up! Player reached level ${event.newLevel}!`);
        console.log(`📈 Upgrade: ${event.upgrade.description}`);
        
        // Here you would trigger visual effects, sounds, UI updates, etc.
        // For now, we'll just log the upgrade information
        
        const entity = this.world.getEntity(event.entityId);
        if (entity) {
            const stats = entity.getComponent(ShipStatsComponent);
            const visuals = entity.getComponent(VisualUpgradeComponent);
            
            if (stats) {
                console.log('📊 New Stats:', stats.currentStats);
            }
            
            if (visuals) {
                console.log('🎨 New Visuals:', visuals.currentVisuals);
            }
        }
    }
    
    private update(): void {
        const currentTime = performance.now();
        const deltaTime = this.lastTime === 0 ? 0 : currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update the ECS world (which includes the leveling system)
        this.world.update(deltaTime);
    }
    
    // Public API for game integration
    public createPlayer(): Entity {
        this.playerEntity = PlayerFactory.createPlayer(this.world);
        return this.playerEntity;
    }
    
    public getPlayer(): Entity | null {
        return this.playerEntity;
    }
    
    public awardXP(amount: number): void {
        if (this.playerEntity) {
            this.levelingSystem.addXP(this.playerEntity.id, amount);
        }
    }
    
    public getPlayerLevel(): number | null {
        if (this.playerEntity) {
            return this.levelingSystem.getCurrentLevel(this.playerEntity.id);
        }
        return null;
    }
    
    public getPlayerXPProgress(): { current: number; required: number; percentage: number } | null {
        if (this.playerEntity) {
            return this.levelingSystem.getXPProgress(this.playerEntity.id);
        }
        return null;
    }
    
    public isPlayerMaxLevel(): boolean {
        if (this.playerEntity) {
            return this.levelingSystem.isMaxLevel(this.playerEntity.id);
        }
        return false;
    }
    
    // Development/testing utilities
    public debugLeveling(): void {
        if (!this.playerEntity) return;
        
        const xpComponent = this.playerEntity.getComponent(XPComponent);
        const statsComponent = this.playerEntity.getComponent(ShipStatsComponent);
        const visualComponent = this.playerEntity.getComponent(VisualUpgradeComponent);
        
        console.log('=== PLAYER DEBUG INFO ===');
        if (xpComponent) {
            console.log(`Level: ${xpComponent.currentLevel}`);
            console.log(`XP: ${xpComponent.currentXP}`);
            console.log(`Total XP Earned: ${xpComponent.totalXPEarned}`);
        }
        
        if (statsComponent) {
            console.log('Stats:', statsComponent.currentStats);
        }
        
        if (visualComponent) {
            console.log('Visuals:', visualComponent.currentVisuals);
        }
        
        const progress = this.getPlayerXPProgress();
        if (progress) {
            console.log(`XP Progress: ${progress.current}/${progress.required} (${progress.percentage.toFixed(1)}%)`);
        }
    }
    
    public forceLevel(targetLevel: number): void {
        if (!this.playerEntity || targetLevel < 1 || targetLevel > 6) return;
        
        const xpComponent = this.playerEntity.getComponent(XPComponent);
        if (!xpComponent) return;
        
        // Calculate required XP for target level using the static method
        const requiredXP = LevelingCalculator.getNextLevelThreshold(targetLevel - 1);
        
        // Set XP to just enough to reach the target level
        xpComponent.currentXP = requiredXP;
        xpComponent.totalXPEarned = requiredXP;
    }
}