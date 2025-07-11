import { System } from '../ecs/System';
import { XPComponent } from '../components/XPComponent';
import { ShipStatsComponent } from '../components/ShipStatsComponent';
import { VisualUpgradeComponent } from '../components/VisualUpgradeComponent';
import { LEVELING_CONFIG, LevelingCalculator } from '../config/LevelingConfig';

export interface LevelUpEvent {
    entityId: number;
    oldLevel: number;
    newLevel: number;
    xpGained: number;
    upgrade: any;
}

export class LevelingSystem extends System {
    private levelUpCallbacks: ((event: LevelUpEvent) => void)[] = [];
    
    update(deltaTime: number): void {
        const entitiesWithXP = this.world.getEntitiesWith(XPComponent);
        
        for (const entity of entitiesWithXP) {
            const xpComponent = entity.getComponent(XPComponent)!;
            this.checkForLevelUp(entity.id, xpComponent);
        }
    }
    
    addXP(entityId: number, amount: number): void {
        const entity = this.world.getEntity(entityId);
        if (!entity) return;
        
        const xpComponent = entity.getComponent(XPComponent);
        if (!xpComponent) return;
        
        xpComponent.addXP(amount);
        this.checkForLevelUp(entityId, xpComponent);
    }
    
    private checkForLevelUp(entityId: number, xpComponent: XPComponent): void {
        const currentLevel = xpComponent.currentLevel;
        const currentXP = xpComponent.currentXP;
        
        // Check if we can level up
        if (currentLevel >= LEVELING_CONFIG.maxLevel) return;
        
        const nextLevelThreshold = LevelingCalculator.getNextLevelThreshold(currentLevel);
        
        if (currentXP >= nextLevelThreshold) {
            this.performLevelUp(entityId, xpComponent, currentLevel + 1);
            
            // Check for multiple level ups
            this.checkForLevelUp(entityId, xpComponent);
        }
    }
    
    private performLevelUp(entityId: number, xpComponent: XPComponent, newLevel: number): void {
        const entity = this.world.getEntity(entityId);
        if (!entity) return;
        
        const oldLevel = xpComponent.currentLevel;
        const upgrade = LevelingCalculator.getLevelUpgrade(newLevel);
        
        if (!upgrade) return;
        
        // Update level
        xpComponent.setLevel(newLevel);
        
        // Calculate excess XP to carry over
        const threshold = LevelingCalculator.getNextLevelThreshold(oldLevel);
        const excessXP = xpComponent.currentXP - threshold;
        xpComponent.resetXP(Math.max(0, excessXP));
        
        // Apply stat upgrades
        const statsComponent = entity.getComponent(ShipStatsComponent);
        if (statsComponent && upgrade.statModifiers) {
            statsComponent.updateStats(upgrade.statModifiers);
        }
        
        // Apply visual upgrades
        const visualComponent = entity.getComponent(VisualUpgradeComponent);
        if (visualComponent && upgrade.visualUpgrades) {
            visualComponent.applyUpgrade(upgrade.visualUpgrades);
        }
        
        // Trigger level up event
        const levelUpEvent: LevelUpEvent = {
            entityId,
            oldLevel,
            newLevel,
            xpGained: 0, // This could be enhanced to track XP gained in this session
            upgrade
        };
        
        this.triggerLevelUpCallbacks(levelUpEvent);
    }
    
    public onLevelUp(callback: (event: LevelUpEvent) => void): void {
        this.levelUpCallbacks.push(callback);
    }
    
    private triggerLevelUpCallbacks(event: LevelUpEvent): void {
        for (const callback of this.levelUpCallbacks) {
            try {
                callback(event);
            } catch (error) {
                console.error('Error in level up callback:', error);
            }
        }
    }
    
    // Utility methods for UI integration
    public getXPProgress(entityId: number): { current: number; required: number; percentage: number } | null {
        const entity = this.world.getEntity(entityId);
        if (!entity) return null;
        
        const xpComponent = entity.getComponent(XPComponent);
        if (!xpComponent) return null;
        
        const currentXP = xpComponent.currentXP;
        const requiredXP = LevelingCalculator.getNextLevelThreshold(xpComponent.currentLevel);
        
        return {
            current: currentXP,
            required: requiredXP === Infinity ? currentXP : requiredXP,
            percentage: requiredXP === Infinity ? 100 : (currentXP / requiredXP) * 100
        };
    }
    
    public getCurrentLevel(entityId: number): number | null {
        const entity = this.world.getEntity(entityId);
        if (!entity) return null;
        
        const xpComponent = entity.getComponent(XPComponent);
        return xpComponent ? xpComponent.currentLevel : null;
    }
    
    public isMaxLevel(entityId: number): boolean {
        const level = this.getCurrentLevel(entityId);
        return level !== null && level >= LEVELING_CONFIG.maxLevel;
    }
}