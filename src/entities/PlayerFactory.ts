import { World } from '../ecs/World';
import { Entity } from '../ecs/Entity';
import { XPComponent } from '../components/XPComponent';
import { ShipStatsComponent } from '../components/ShipStatsComponent';
import { VisualUpgradeComponent } from '../components/VisualUpgradeComponent';

export interface PlayerConfig {
    initialXP?: number;
    initialLevel?: number;
    initialStats?: Partial<import('../components/ShipStatsComponent').ShipStats>;
    initialVisuals?: Partial<import('../components/VisualUpgradeComponent').VisualUpgrades>;
}

export class PlayerFactory {
    static createPlayer(world: World, config: PlayerConfig = {}): Entity {
        const player = world.createEntity();
        
        // Add XP component
        player.addComponent(XPComponent, config.initialXP || 0, config.initialLevel || 1);
        
        // Add ship stats component
        player.addComponent(ShipStatsComponent, config.initialStats || {});
        
        // Add visual upgrade component
        player.addComponent(VisualUpgradeComponent, config.initialVisuals || {});
        
        return player;
    }
    
    static createTestPlayer(world: World, level: number = 1, xp: number = 0): Entity {
        return this.createPlayer(world, {
            initialLevel: level,
            initialXP: xp,
            initialStats: {
                speed: 5,
                health: 100,
                maxHealth: 100,
                firepower: 10,
                fireRate: 1,
                range: 50
            }
        });
    }
}