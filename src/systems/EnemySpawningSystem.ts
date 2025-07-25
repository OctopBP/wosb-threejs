import { enemyXPConfig } from '../config/LevelingConfig'
import type { HealthComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { LevelingSystem } from './LevelingSystem'

export class EnemySpawningSystem extends System {
    private levelingSystem: LevelingSystem | null = null

    constructor(world: World) {
        super(world, []) // No required components for spawning system
    }

    // Method to set the leveling system reference
    setLevelingSystem(levelingSystem: LevelingSystem): void {
        this.levelingSystem = levelingSystem
    }

    update(_deltaTime: number): void {
        this.cleanupDeadEnemies()
    }

    private cleanupDeadEnemies(): void {
        const enemies = this.world.getEntitiesWithComponents([
            'enemy',
            'health',
        ])

        // Find newly dead enemies (dead but don't have death animation component yet)
        const newlyDeadEnemies = enemies.filter((enemy) => {
            const health = enemy.getComponent<HealthComponent>('health')
            const hasDeathAnimation = enemy.hasComponent('deathAnimation')
            return health?.isDead === true && !hasDeathAnimation
        })

        // Award XP for newly dead enemies
        if (newlyDeadEnemies.length > 0 && this.levelingSystem) {
            // Find the player entity to award XP to
            const playerEntities = this.world.getEntitiesWithComponents([
                'player',
            ])
            if (playerEntities.length > 0) {
                const player = playerEntities[0]

                for (const _ of newlyDeadEnemies) {
                    // Award XP for each enemy type (currently only basic enemies)
                    const xpAwarded = enemyXPConfig.basicEnemy
                    this.levelingSystem.awardXP(player.id, xpAwarded)
                    console.log(
                        `💀 Enemy defeated! Awarded ${xpAwarded} XP to player`,
                    )
                }
            }
        }
    }
}
