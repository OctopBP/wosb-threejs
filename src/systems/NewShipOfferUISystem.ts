import type { GameStateComponent } from '../ecs/Component'
import { System } from '../ecs/System'

import type { World } from '../ecs/World'
import type { GameStateSystem } from './GameStateSystem'

export class NewShipOfferUISystem extends System {
    private offerUI: HTMLElement | null = null
    private isUICreated = false
    private gameStateSystem: GameStateSystem | null = null

    constructor(world: World) {
        super(world, [])
    }

    // Method to set the game state system reference for restarting
    setGameStateSystem(gameStateSystem: GameStateSystem): void {
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

        // Create overlay container with black fade
        this.offerUI = document.createElement('div')
        this.offerUI.style.position = 'fixed'
        this.offerUI.style.top = '0'
        this.offerUI.style.left = '0'
        this.offerUI.style.width = '100%'
        this.offerUI.style.height = '100%'
        this.offerUI.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
        this.offerUI.style.display = 'none'
        this.offerUI.style.justifyContent = 'center'
        this.offerUI.style.alignItems = 'center'
        this.offerUI.style.flexDirection = 'column'
        this.offerUI.style.zIndex = '10000'
        this.offerUI.style.fontFamily = 'Arial, sans-serif'

        // Create main content container
        const contentContainer = document.createElement('div')
        contentContainer.style.display = 'flex'
        contentContainer.style.flexDirection = 'column'
        contentContainer.style.alignItems = 'center'
        contentContainer.style.textAlign = 'center'
        contentContainer.style.maxWidth = '500px'
        contentContainer.style.width = '90%'

        // Create text above image
        const topText = document.createElement('h1')
        topText.textContent = 'UPGRADE YOUR SHIP'
        topText.style.color = '#FFD700'
        topText.style.fontSize = '32px'
        topText.style.fontWeight = 'bold'
        topText.style.margin = '0 0 30px 0'
        topText.style.textShadow = '3px 3px 6px rgba(0, 0, 0, 0.8)'
        topText.style.letterSpacing = '2px'

        // Create prince logo image
        const logoImage = document.createElement('img')
        logoImage.src = '/assets/ui/prince_nologo_glow.png'
        logoImage.style.width = '300px'
        logoImage.style.height = 'auto'
        logoImage.style.margin = '20px 0'
        logoImage.style.filter = 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))'

        // Create text below image
        const bottomText = document.createElement('p')
        bottomText.textContent =
            'Your current ship is no match for the boss!\nGet the ultimate warship and dominate the seas!'
        bottomText.style.color = '#FFFFFF'
        bottomText.style.fontSize = '18px'
        bottomText.style.margin = '30px 0 40px 0'
        bottomText.style.opacity = '0.95'
        bottomText.style.lineHeight = '1.5'
        bottomText.style.whiteSpace = 'pre-line'
        bottomText.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)'

        // Create button using btn.png
        const buttonContainer = document.createElement('div')
        buttonContainer.style.position = 'relative'
        buttonContainer.style.cursor = 'pointer'
        buttonContainer.style.transition = 'transform 0.2s ease'

        const buttonImage = document.createElement('img')
        buttonImage.src = '/assets/ui/btn.png'
        buttonImage.style.width = '200px'
        buttonImage.style.height = 'auto'
        buttonImage.style.filter = 'drop-shadow(0 4px 15px rgba(0, 0, 0, 0.5))'

        const buttonText = document.createElement('div')
        buttonText.textContent = 'GET IT NOW!'
        buttonText.style.position = 'absolute'
        buttonText.style.top = '50%'
        buttonText.style.left = '50%'
        buttonText.style.transform = 'translate(-50%, -50%)'
        buttonText.style.color = '#FFFFFF'
        buttonText.style.fontSize = '18px'
        buttonText.style.fontWeight = 'bold'
        buttonText.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)'
        buttonText.style.pointerEvents = 'none'

        // Add hover effects to button
        buttonContainer.addEventListener('mouseenter', () => {
            buttonContainer.style.transform = 'scale(1.05)'
            buttonImage.style.filter =
                'drop-shadow(0 4px 15px rgba(0, 0, 0, 0.5)) brightness(1.1)'
        })

        buttonContainer.addEventListener('mouseleave', () => {
            buttonContainer.style.transform = 'scale(1)'
            buttonImage.style.filter =
                'drop-shadow(0 4px 15px rgba(0, 0, 0, 0.5))'
        })

        // Add click handler
        buttonContainer.addEventListener('click', () => {
            this.handleGetItClick()
        })

        // Assemble button
        buttonContainer.appendChild(buttonImage)
        buttonContainer.appendChild(buttonText)

        // Assemble the UI
        contentContainer.appendChild(topText)
        contentContainer.appendChild(logoImage)
        contentContainer.appendChild(bottomText)
        contentContainer.appendChild(buttonContainer)
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
