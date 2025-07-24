import type { GameStateConfig } from '../config/GameStateConfig'
import type { GameStateComponent, HealthComponent } from '../ecs/Component'
import { System } from '../ecs/System'

import type { World } from '../ecs/World'

export class GoalUISystem extends System {
    private goalContainer: HTMLElement | null = null
    private goalText: HTMLElement | null = null
    private counterText: HTMLElement | null = null
    private isUICreated = false
    private config: GameStateConfig | null = null

    constructor(world: World, config: GameStateConfig) {
        super(world, [])
        this.config = config
    }

    init(): void {
        this.createUI()
    }

    update(_deltaTime: number): void {
        const gameStateEntities = this.world.getEntitiesWithComponents([
            'gameState',
        ])
        if (gameStateEntities.length === 0) {
            this.hideUI()
            return
        }

        const gameStateEntity = gameStateEntities[0]
        const gameState =
            gameStateEntity.getComponent<GameStateComponent>('gameState')
        if (!gameState) {
            this.hideUI()
            return
        }

        // Don't show goal UI during new ship offer
        if (gameState.currentState === 'newShipOffer') {
            this.hideUI()
            return
        }

        this.updateGoalDisplay(gameState)
        this.showUI()
    }

    private createUI(): void {
        if (this.isUICreated) return

        // Create goal container (top center, flex row)
        this.goalContainer = document.createElement('div')
        this.goalContainer.style.position = 'fixed'
        this.goalContainer.style.top = '10px'
        this.goalContainer.style.left = '50%'
        this.goalContainer.style.transform = 'translateX(-50%)'
        this.goalContainer.style.zIndex = '1002'
        this.goalContainer.style.pointerEvents = 'none'
        this.goalContainer.style.fontFamily = 'Arial, sans-serif'
        this.goalContainer.style.fontSize = '18px'
        this.goalContainer.style.fontWeight = 'bold'
        this.goalContainer.style.color = '#ffffff'
        this.goalContainer.style.textShadow = '3px 3px 6px rgba(0, 0, 0, 0.5)'
        this.goalContainer.style.textAlign = 'center'
        this.goalContainer.style.letterSpacing = '1px'
        this.goalContainer.style.display = 'flex'
        this.goalContainer.style.alignItems = 'center'
        this.goalContainer.style.gap = '16px'

        // Goal text
        this.goalText = document.createElement('div')
        this.goalText.style.flex = 'none'
        this.goalContainer.appendChild(this.goalText)

        // Counter (icon + text, in a flex row)
        const counterWrapper = document.createElement('div')
        counterWrapper.style.display = 'flex'
        counterWrapper.style.alignItems = 'center'
        counterWrapper.style.gap = '12px'

        // Counter background with enemy icon
        const counterBg = document.createElement('div')
        counterBg.style.position = 'relative'
        counterBg.style.width = '80px'
        counterBg.style.height = '40px'
        counterBg.style.backgroundImage = 'url(assets/ui/enemy_counter_bg.png)'
        counterBg.style.backgroundSize = 'contain'
        counterBg.style.backgroundRepeat = 'no-repeat'
        counterBg.style.backgroundPosition = 'center'

        // Enemy icon
        const enemyIcon = document.createElement('img')
        enemyIcon.src = 'assets/ui/enemy_icon.png'
        enemyIcon.style.position = 'absolute'
        enemyIcon.style.left = '8px'
        enemyIcon.style.top = '50%'
        enemyIcon.style.transform = 'translateY(-50%)'
        enemyIcon.style.width = '24px'
        enemyIcon.style.height = '24px'
        enemyIcon.style.objectFit = 'contain'
        counterBg.appendChild(enemyIcon)

        // Counter text
        this.counterText = document.createElement('div')
        this.counterText.style.fontFamily = 'Arial, sans-serif'
        this.counterText.style.fontSize = '18px'
        this.counterText.style.fontWeight = 'bold'
        this.counterText.style.color = '#FFFFFF'
        this.counterText.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)'
        this.counterText.style.position = 'absolute'
        this.counterText.style.right = '8px'
        this.counterText.style.top = '50%'
        this.counterText.style.transform = 'translateY(-50%)'
        counterBg.appendChild(this.counterText)

        counterWrapper.appendChild(counterBg)
        this.goalContainer.appendChild(counterWrapper)

        // Add to page
        document.body.appendChild(this.goalContainer)
        this.isUICreated = true
    }

    private updateGoalDisplay(gameState: GameStateComponent): void {
        if (!this.goalText || !this.counterText || !this.config) return

        let goalMessage = ''
        let killedCount = 0
        let totalCount = 0

        switch (gameState.currentState) {
            case 'initialWave':
                goalMessage = `Defeat ${this.config.initialWave.enemyCount} enemy`
                totalCount = this.config.initialWave.enemyCount
                killedCount = this.calculateKilledEnemies(
                    gameState,
                    'initialWave',
                )
                break

            case 'enemiesWave1':
                goalMessage = `Defeat ${this.config.wave1.enemyCount} enemies`
                totalCount = this.config.wave1.enemyCount
                killedCount = this.calculateKilledEnemies(gameState, 'wave1')
                break

            case 'enemiesWave2':
                goalMessage = `Defeat ${this.config.wave2.enemyCount} enemies`
                totalCount = this.config.wave2.enemyCount
                killedCount = this.calculateKilledEnemies(gameState, 'wave2')
                break

            case 'bossFight': {
                goalMessage = 'Defeat the Boss'
                // For boss, we'll show different counter logic
                const bossEntities = this.world.getEntitiesWithComponents([
                    'boss',
                    'health',
                ])
                const aliveBosses = bossEntities.filter((boss) => {
                    const health = boss.getComponent<HealthComponent>('health')
                    return health && !health.isDead
                })
                killedCount = gameState.bossSpawned
                    ? aliveBosses.length === 0
                        ? 1
                        : 0
                    : 0
                totalCount = 1
                break
            }

            default:
                goalMessage = ''
                killedCount = 0
                totalCount = 0
        }

        this.goalText.textContent = goalMessage
        this.counterText.textContent = `${killedCount}/${totalCount}`
    }

    private calculateKilledEnemies(
        gameState: GameStateComponent,
        wave: 'initialWave' | 'wave1' | 'wave2',
    ): number {
        // Get alive enemies count (excluding boss)
        const aliveEnemies = this.world
            .getEntitiesWithComponents(['enemy', 'health'])
            .filter((enemy) => {
                const health = enemy.getComponent<HealthComponent>('health')
                const isBoss = enemy.hasComponent('boss')
                return health && !health.isDead && !isBoss
            })

        let spawnedCount = 0
        switch (wave) {
            case 'initialWave':
                spawnedCount = gameState.initialWaveEnemiesSpawned
                break
            case 'wave1':
                spawnedCount = gameState.wave1EnemiesSpawned
                break
            case 'wave2':
                spawnedCount = gameState.wave2EnemiesSpawned
                break
        }

        // Killed = Spawned - Alive
        return Math.max(0, spawnedCount - aliveEnemies.length)
    }

    private showUI(): void {
        if (this.goalContainer) {
            this.goalContainer.style.display = 'flex'
        }
    }

    private hideUI(): void {
        if (this.goalContainer) {
            this.goalContainer.style.display = 'none'
        }
    }

    cleanup(): void {
        if (this.goalContainer?.parentNode) {
            this.goalContainer.parentNode.removeChild(this.goalContainer)
        }
        this.isUICreated = false
    }
}
