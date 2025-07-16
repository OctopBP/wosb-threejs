import { BossComponent } from '../components/BossComponent'
import { GameStateComponent } from '../components/GameStateComponent'
import type {
    EnemyComponent,
    HealthComponent,
    PlayerComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import { GameState, WAVE_CONFIGS } from '../types/GameState'

export class GameStateSystem extends System {
    private gameStateEntity: any
    private gameStateComponent!: GameStateComponent
    private uiContainer: HTMLElement | null = null
    private newShipOfferUI: HTMLElement | null = null

    constructor(world: World) {
        super(world)
        this.initializeGameState()
        this.createNewShipOfferUI()
    }

    private initializeGameState(): void {
        // Create a global game state entity
        this.gameStateEntity = this.world.createEntity()
        this.gameStateComponent = new GameStateComponent()
        this.gameStateEntity.addComponent(this.gameStateComponent)
    }

    private createNewShipOfferUI(): void {
        this.uiContainer = document.createElement('div')
        this.uiContainer.id = 'game-state-ui'
        this.uiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `

        this.newShipOfferUI = document.createElement('div')
        this.newShipOfferUI.style.cssText = `
            background-color: #2c3e50;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
            border: 3px solid #3498db;
            box-shadow: 0 0 20px rgba(52, 152, 219, 0.5);
            max-width: 400px;
            width: 90%;
        `

        const title = document.createElement('h2')
        title.textContent = 'You need better ship'
        title.style.cssText = `
            color: #ecf0f1;
            margin-bottom: 20px;
            font-size: 24px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        `

        const button = document.createElement('button')
        button.textContent = 'Get it'
        button.style.cssText = `
            background-color: #3498db;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        `

        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#2980b9'
        })

        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#3498db'
        })

        button.addEventListener('click', () => {
            this.handleGetItClick()
        })

        this.newShipOfferUI.appendChild(title)
        this.newShipOfferUI.appendChild(button)
        this.uiContainer.appendChild(this.newShipOfferUI)
        document.body.appendChild(this.uiContainer)
    }

    private handleGetItClick(): void {
        // This would typically trigger a conversion event or redirect to app store
        console.log('Player clicked "Get it" - triggering conversion')
        // For now, just hide the UI and reset the game
        this.hideNewShipOfferUI()
        this.resetGame()
    }

    private showNewShipOfferUI(): void {
        if (this.uiContainer) {
            this.uiContainer.style.display = 'flex'
        }
    }

    private hideNewShipOfferUI(): void {
        if (this.uiContainer) {
            this.uiContainer.style.display = 'none'
        }
    }

    private resetGame(): void {
        this.gameStateComponent.reset()

        // Reset player health
        const players = this.world.getEntitiesWithComponents([
            'player',
            'health',
        ])
        players.forEach((player) => {
            const health = player.getComponent<HealthComponent>('health')
            if (health) {
                health.currentHealth = health.maxHealth
                health.isDead = false
            }
        })

        // Remove all enemies
        const enemies = this.world.getEntitiesWithComponents(['enemy'])
        enemies.forEach((enemy) => {
            this.world.removeEntity(enemy.id)
        })
    }

    public update(deltaTime: number): void {
        const currentState = this.gameStateComponent.getCurrentState()

        switch (currentState) {
            case GameState.WAVE_1:
                this.handleWave1()
                break
            case GameState.WAVE_2:
                this.handleWave2()
                break
            case GameState.BOSS_FIGHT:
                this.handleBossFight()
                break
            case GameState.NEW_SHIP_OFFER:
                this.handleNewShipOffer()
                break
        }

        // Check for player death in any state
        this.checkPlayerDeath()
    }

    private handleWave1(): void {
        if (this.gameStateComponent.isWave1Complete()) {
            console.log('Wave 1 complete! Moving to Wave 2')
            this.gameStateComponent.setState(GameState.WAVE_2)
        }
    }

    private handleWave2(): void {
        if (this.gameStateComponent.isWave2Complete()) {
            console.log('Wave 2 complete! Moving to Boss Fight')
            this.gameStateComponent.setState(GameState.BOSS_FIGHT)
        }
    }

    private handleBossFight(): void {
        if (this.gameStateComponent.isBossFightComplete()) {
            console.log('Boss defeated! Player wins!')
            // For now, just show the new ship offer
            this.gameStateComponent.setState(GameState.NEW_SHIP_OFFER)
        }
    }

    private handleNewShipOffer(): void {
        this.showNewShipOfferUI()
    }

    private checkPlayerDeath(): void {
        const players = this.world.getEntitiesWithComponents([
            'player',
            'health',
        ])
        const playerDead = players.some((player) => {
            const health = player.getComponent<HealthComponent>('health')
            return health?.isDead === true
        })

        if (playerDead && !this.gameStateComponent.data.playerDead) {
            console.log('Player died! Moving to New Ship Offer')
            this.gameStateComponent.setPlayerDead()
            this.gameStateComponent.setState(GameState.NEW_SHIP_OFFER)
        }
    }

    public getGameStateComponent(): GameStateComponent {
        return this.gameStateComponent
    }

    public getCurrentState(): GameState {
        return this.gameStateComponent.getCurrentState()
    }

    public getWaveConfig(state: GameState) {
        return WAVE_CONFIGS[state]
    }
}
