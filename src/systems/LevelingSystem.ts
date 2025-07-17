import type { XPProgressionConfig } from '../config/LevelingConfig'
import {
    calculateNextLevelXP,
    defaultXPProgression,
    levelUpAnimation,
    visualUpgrades,
} from '../config/LevelingConfig'
import type {
    HealthComponent,
    LevelComponent,
    LevelingStatsComponent,
    MovementConfigComponent,
    RenderableComponent,
    WeaponComponent,
    XPComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class LevelingSystem extends System {
    private xpProgressionConfig: XPProgressionConfig

    constructor(
        world: World,
        xpConfig: XPProgressionConfig = defaultXPProgression,
    ) {
        super(world, ['xp', 'level', 'levelingStats'])
        this.xpProgressionConfig = xpConfig
    }

    update(_deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const xp = entity.getComponent<XPComponent>('xp')
            const level = entity.getComponent<LevelComponent>('level')
            const levelingStats =
                entity.getComponent<LevelingStatsComponent>('levelingStats')

            if (!xp || !level || !levelingStats) continue

            // Check for level-ups
            this.processLevelUp(entity, xp, level, levelingStats)

            // Reset level-up flag after a short time to allow for animations
            if (
                level.hasLeveledUp &&
                performance.now() / 1000 - level.levelUpTime > 2.0
            ) {
                level.hasLeveledUp = false
            }
        }
    }

    // Public method to award XP to an entity
    public awardXP(entityId: number, xpAmount: number): boolean {
        const entity = this.world.getEntity(entityId)
        if (!entity) return false

        const xp = entity.getComponent<XPComponent>('xp')
        if (!xp) return false

        xp.currentXP += xpAmount
        xp.totalXP += xpAmount

        console.log(
            `🎯 Awarded ${xpAmount} XP to entity ${entityId}. Current XP: ${xp.currentXP}, Total: ${xp.totalXP}`,
        )
        return true
    }

    private processLevelUp(
        entity: Entity,
        xp: XPComponent,
        level: LevelComponent,
        levelingStats: LevelingStatsComponent,
    ): void {
        // Check if player has enough XP to level up
        const nextLevelXP = calculateNextLevelXP(
            level.currentLevel,
            this.xpProgressionConfig,
        )

        if (
            xp.currentXP >= nextLevelXP &&
            level.currentLevel < level.maxLevel
        ) {
            // Level up!
            level.currentLevel += 1
            level.hasLeveledUp = true
            level.levelUpTime = performance.now() / 1000

            console.log(
                `🎉 LEVEL UP! Entity ${entity.id} reached level ${level.currentLevel}!`,
            )

            // Apply stat improvements
            this.applyStatImprovements(
                entity,
                levelingStats,
                level.currentLevel,
            )

            // Restore health to max on level up
            this.restoreHealthToMax(entity)

            // Apply visual upgrades
            this.applyVisualUpgrades(entity, level.currentLevel)

            // Trigger level-up animation
            this.triggerLevelUpAnimation(entity)

            // Handle excess XP - carry over to next level
            const excessXP = xp.currentXP - nextLevelXP
            xp.currentXP = excessXP

            // Check for multiple level-ups (edge case)
            if (excessXP > 0) {
                this.processLevelUp(entity, xp, level, levelingStats)
            }
        }
    }

    private applyStatImprovements(
        entity: Entity,
        levelingStats: LevelingStatsComponent,
        newLevel: number,
    ): void {
        // Update weapon damage and fire rate
        const weapon = entity.getComponent<WeaponComponent>('weapon')
        if (weapon) {
            weapon.damage =
                levelingStats.baseDamage +
                levelingStats.damagePerLevel * (newLevel - 1)
            weapon.fireRate =
                levelingStats.baseFireRate +
                levelingStats.fireRatePerLevel * (newLevel - 1)
            console.log(
                `⚔️ Weapon upgraded: Damage ${weapon.damage}, Fire Rate ${weapon.fireRate}`,
            )
        }

        // Update health (max health)
        const health = entity.getComponent<HealthComponent>('health')
        if (health) {
            const newMaxHealth =
                levelingStats.baseMaxHealth +
                levelingStats.healthPerLevel * (newLevel - 1)
            const healthIncrease = newMaxHealth - health.maxHealth
            health.maxHealth = newMaxHealth
            health.currentHealth += healthIncrease // Add the health increase to current health
            console.log(
                `❤️ Health upgraded: Max Health ${health.maxHealth}, Current Health ${health.currentHealth}`,
            )
        }

        // Update movement speed
        const movementConfig =
            entity.getComponent<MovementConfigComponent>('movementConfig')
        if (movementConfig) {
            movementConfig.maxSpeed =
                levelingStats.baseMaxSpeed +
                levelingStats.speedPerLevel * (newLevel - 1)
            console.log(
                `💨 Speed upgraded: Max Speed ${movementConfig.maxSpeed}`,
            )
        }
    }

    private restoreHealthToMax(entity: Entity): void {
        const health = entity.getComponent<HealthComponent>('health')
        if (health) {
            health.currentHealth = health.maxHealth
            health.isDead = false
            console.log(`🏥 Health restored to max: ${health.maxHealth}`)
        }
    }

    private applyVisualUpgrades(entity: Entity, level: number): void {
        const renderable =
            entity.getComponent<RenderableComponent>('renderable')
        if (!renderable?.mesh) return

        // Find the visual upgrade configuration for this level
        const upgrade = visualUpgrades.find((u) => u.level === level)
        if (!upgrade) return

        console.log(`🎨 Applying visual upgrades for level ${level}`)

        // Apply upgrades to the mesh
        // Note: This is a basic implementation - in a real game you'd have more sophisticated
        // mesh manipulation or swap out model parts
        if (
            upgrade.hull &&
            'material' in renderable.mesh &&
            renderable.mesh.material
        ) {
            // Apply hull color and material changes
            const material = Array.isArray(renderable.mesh.material)
                ? renderable.mesh.material[0]
                : renderable.mesh.material

            if ('color' in material && upgrade.hull.color) {
                material.color.setHex(
                    parseInt(upgrade.hull.color.replace('#', ''), 16),
                )
            }
            if (
                'metalness' in material &&
                upgrade.hull.metallic !== undefined
            ) {
                material.metalness = upgrade.hull.metallic
            }
        }

        // Store upgrade info on the renderable component for future reference
        if (!renderable.upgrades) {
            renderable.upgrades = {}
        }
        renderable.upgrades[level] = upgrade
    }

    private triggerLevelUpAnimation(entity: Entity): void {
        const renderable =
            entity.getComponent<RenderableComponent>('renderable')
        if (!renderable?.mesh) return

        // Store original scale
        const originalScale = renderable.mesh.scale.clone()

        // Animate scale up then back down
        const startTime = performance.now()
        const animateLevelUp = () => {
            const elapsed = (performance.now() - startTime) / 1000
            const progress = Math.min(
                elapsed / levelUpAnimation.scaleDuration,
                1,
            )

            if (!renderable.mesh) {
                return
            }

            if (progress < 0.5) {
                // Scale up phase
                const scaleProgress = progress * 2
                const scale =
                    1 + (levelUpAnimation.scaleMultiplier - 1) * scaleProgress
                renderable.mesh.scale.copy(originalScale).multiplyScalar(scale)
            } else {
                // Scale down phase
                const scaleProgress = (progress - 0.5) * 2
                const scale =
                    levelUpAnimation.scaleMultiplier -
                    (levelUpAnimation.scaleMultiplier - 1) * scaleProgress
                renderable.mesh.scale.copy(originalScale).multiplyScalar(scale)
            }

            if (progress < 1) {
                requestAnimationFrame(animateLevelUp)
            } else {
                // Reset to original scale
                renderable.mesh.scale.copy(originalScale)
            }
        }

        animateLevelUp()
        console.log(`✨ Level-up animation triggered for entity ${entity.id}`)
    }

    // Helper method to get current XP progress for UI
    public getXPProgress(
        entityId: number,
    ): { currentXP: number; nextLevelXP: number; progress: number } | null {
        const entity = this.world.getEntity(entityId)
        if (!entity) return null

        const xp = entity.getComponent<XPComponent>('xp')
        const level = entity.getComponent<LevelComponent>('level')
        if (!xp || !level) return null

        const nextLevelXP = calculateNextLevelXP(
            level.currentLevel,
            this.xpProgressionConfig,
        )
        const progress =
            level.currentLevel >= level.maxLevel
                ? 1
                : xp.currentXP / nextLevelXP

        return {
            currentXP: xp.currentXP,
            nextLevelXP: nextLevelXP,
            progress: Math.min(progress, 1),
        }
    }

    // Helper method to get current level info for UI
    public getLevelInfo(entityId: number): {
        currentLevel: number
        maxLevel: number
        hasLeveledUp: boolean
    } | null {
        const entity = this.world.getEntity(entityId)
        if (!entity) return null

        const level = entity.getComponent<LevelComponent>('level')
        if (!level) return null

        return {
            currentLevel: level.currentLevel,
            maxLevel: level.maxLevel,
            hasLeveledUp: level.hasLeveledUp,
        }
    }
}
