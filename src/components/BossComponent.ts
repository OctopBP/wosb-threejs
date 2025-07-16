import type { BossComponent as BossComponentInterface } from '../ecs/Component'

export class BossComponent implements BossComponentInterface {
    public readonly type = 'boss' as const
    public isBoss: boolean = true
    public damageMultiplier: number = 3 // Boss does 3x damage to kill player in 3 shots
    public maxHealth: number = 300 // Boss has more health than regular enemies
    public size: number = 2.0 // Boss is larger than regular enemies
    public color: string = '#ff0000' // Red color for boss

    constructor() {}
}
