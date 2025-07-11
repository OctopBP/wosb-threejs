import { Component } from '../ecs/Component';

export interface ShipStats {
    speed: number;
    health: number;
    maxHealth: number;
    firepower: number;
    fireRate: number;
    range: number;
}

export class ShipStatsComponent extends Component {
    baseStats: ShipStats;
    currentStats: ShipStats;
    
    constructor(entityId: number, initialStats: Partial<ShipStats> = {}) {
        super(entityId);
        
        const defaultStats: ShipStats = {
            speed: 5,
            health: 100,
            maxHealth: 100,
            firepower: 10,
            fireRate: 1,
            range: 50
        };
        
        this.baseStats = { ...defaultStats, ...initialStats };
        this.currentStats = { ...this.baseStats };
    }
    
    updateStats(statModifiers: Partial<ShipStats>): void {
        this.currentStats = {
            speed: this.baseStats.speed + (statModifiers.speed || 0),
            health: Math.min(this.currentStats.health, this.baseStats.maxHealth + (statModifiers.maxHealth || 0)),
            maxHealth: this.baseStats.maxHealth + (statModifiers.maxHealth || 0),
            firepower: this.baseStats.firepower + (statModifiers.firepower || 0),
            fireRate: this.baseStats.fireRate + (statModifiers.fireRate || 0),
            range: this.baseStats.range + (statModifiers.range || 0)
        };
    }
    
    takeDamage(damage: number): boolean {
        this.currentStats.health = Math.max(0, this.currentStats.health - damage);
        return this.currentStats.health <= 0;
    }
    
    heal(amount: number): void {
        this.currentStats.health = Math.min(this.currentStats.maxHealth, this.currentStats.health + amount);
    }
}