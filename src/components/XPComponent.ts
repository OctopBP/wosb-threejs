import { Component } from '../ecs/Component';

export class XPComponent extends Component {
    currentXP: number = 0;
    currentLevel: number = 1;
    totalXPEarned: number = 0;
    
    constructor(entityId: number, initialXP: number = 0, initialLevel: number = 1) {
        super(entityId);
        this.currentXP = initialXP;
        this.currentLevel = initialLevel;
        this.totalXPEarned = initialXP;
    }
    
    addXP(amount: number): void {
        this.currentXP += amount;
        this.totalXPEarned += amount;
    }
    
    setLevel(level: number): void {
        this.currentLevel = level;
    }
    
    resetXP(amount: number = 0): void {
        this.currentXP = amount;
    }
}