import type { GameStateComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class NewShipOfferUISystem extends System {
    private canvas: HTMLCanvasElement
    private offerUI: HTMLElement | null = null
    private isUICreated = false
    private gameStateSystem:
        | import('./GameStateSystem').GameStateSystem
        | null = null

    constructor(world: World, canvas: HTMLCanvasElement) {
        super(world, [])
        this.canvas = canvas
    }

    // Method to set the game state system reference for restarting
    setGameStateSystem(
        gameStateSystem: import('./GameStateSystem').GameStateSystem,
    ): void {
        this.gameStateSystem = gameStateSystem
    }

    init(): void {
        this.createUI()
    }

    update(_deltaTime: number): void {
        // Check if we should show the new ship offer
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

        if (gameState.currentState === 'newShipOffer') {
            this.showUI()
        } else {
            this.hideUI()
        }
    }

    private createUI(): void {
        if (this.isUICreated) return

        // Create overlay container
        this.offerUI = document.createElement('div')
        this.offerUI.style.position = 'fixed'
        this.offerUI.style.top = '0'
        this.offerUI.style.left = '0'
        this.offerUI.style.width = '100%'
        this.offerUI.style.height = '100%'
        this.offerUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
        this.offerUI.style.display = 'none'
        this.offerUI.style.justifyContent = 'center'
        this.offerUI.style.alignItems = 'center'
        this.offerUI.style.zIndex = '10000'
        this.offerUI.style.fontFamily = 'Arial, sans-serif'

        // Create content container
        const contentContainer = document.createElement('div')
        contentContainer.style.backgroundColor = 'rgba(20, 30, 40, 0.95)'
        contentContainer.style.padding = '40px'
        contentContainer.style.borderRadius = '15px'
        contentContainer.style.border = '3px solid rgba(255, 255, 255, 0.3)'
        contentContainer.style.textAlign = 'center'
        contentContainer.style.maxWidth = '400px'
        contentContainer.style.width = '90%'
        contentContainer.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)'

        // Create title text
        const titleText = document.createElement('h1')
        titleText.textContent = 'You need better ship'
        titleText.style.color = '#FF6B6B'
        titleText.style.fontSize = '28px'
        titleText.style.fontWeight = 'bold'
        titleText.style.margin = '0 0 30px 0'
        titleText.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)'

        // Create subtitle text
        const subtitleText = document.createElement('p')
        subtitleText.textContent =
            'The boss was too powerful! Your ship needs serious upgrades to survive.'
        subtitleText.style.color = '#FFFFFF'
        subtitleText.style.fontSize = '16px'
        subtitleText.style.margin = '0 0 30px 0'
        subtitleText.style.opacity = '0.9'

        // Create "Get it" button
        const getItButton = document.createElement('button')
        getItButton.textContent = 'Get it'
        getItButton.style.backgroundColor = '#4CAF50'
        getItButton.style.color = 'white'
        getItButton.style.border = 'none'
        getItButton.style.padding = '15px 40px'
        getItButton.style.fontSize = '20px'
        getItButton.style.fontWeight = 'bold'
        getItButton.style.borderRadius = '8px'
        getItButton.style.cursor = 'pointer'
        getItButton.style.transition =
            'background-color 0.3s ease, transform 0.2s ease'
        getItButton.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)'

        // Add hover effects
        getItButton.addEventListener('mouseenter', () => {
            getItButton.style.backgroundColor = '#45a049'
            getItButton.style.transform = 'translateY(-2px)'
        })

        getItButton.addEventListener('mouseleave', () => {
            getItButton.style.backgroundColor = '#4CAF50'
            getItButton.style.transform = 'translateY(0)'
        })

        // Add click handler
        getItButton.addEventListener('click', () => {
            this.handleGetItClick()
        })

        // Assemble the UI
        contentContainer.appendChild(titleText)
        contentContainer.appendChild(subtitleText)
        contentContainer.appendChild(getItButton)
        this.offerUI.appendChild(contentContainer)

        // Add to page
        document.body.appendChild(this.offerUI)
        this.isUICreated = true
    }

    private showUI(): void {
        if (this.offerUI) {
            this.offerUI.style.display = 'flex'
        }
    }

    private hideUI(): void {
        if (this.offerUI) {
            this.offerUI.style.display = 'none'
        }
    }

    private handleGetItClick(): void {
        console.log(
            '🚀 "Get it" button clicked - This would typically redirect to app store',
        )

        // For demo purposes, restart the game (this now handles complete cleanup and player recreation)
        if (this.gameStateSystem) {
            this.gameStateSystem.restartGame()
        }

        // In a real playable ad, this would redirect to the app store:
        // window.open('https://play.google.com/store/apps/details?id=your.game.package', '_blank')
    }

    cleanup(): void {
        if (this.offerUI?.parentNode) {
            this.offerUI.parentNode.removeChild(this.offerUI)
        }
        this.isUICreated = false
    }
}
