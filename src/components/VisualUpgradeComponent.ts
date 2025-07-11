import { Component } from '../ecs/Component';

export interface VisualUpgrades {
    sailType: number;
    cannonCount: number;
    hullColor: string;
    flagType: number;
    decorations: string[];
}

export class VisualUpgradeComponent extends Component {
    currentVisuals: VisualUpgrades;
    
    constructor(entityId: number, initialVisuals: Partial<VisualUpgrades> = {}) {
        super(entityId);
        
        const defaultVisuals: VisualUpgrades = {
            sailType: 0,
            cannonCount: 2,
            hullColor: '#8B4513', // Brown
            flagType: 0,
            decorations: []
        };
        
        this.currentVisuals = { ...defaultVisuals, ...initialVisuals };
    }
    
    applyUpgrade(upgrades: Partial<VisualUpgrades>): void {
        this.currentVisuals = { ...this.currentVisuals, ...upgrades };
    }
    
    addDecoration(decoration: string): void {
        if (!this.currentVisuals.decorations.includes(decoration)) {
            this.currentVisuals.decorations.push(decoration);
        }
    }
    
    removeDecoration(decoration: string): void {
        const index = this.currentVisuals.decorations.indexOf(decoration);
        if (index !== -1) {
            this.currentVisuals.decorations.splice(index, 1);
        }
    }
}