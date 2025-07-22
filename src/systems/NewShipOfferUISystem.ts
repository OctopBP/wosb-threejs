import type { GameStateComponent } from '../ecs/Component'
import { System } from '../ecs/System'

import type { World } from '../ecs/World'
import type { GameStateSystem } from './GameStateSystem'

// UI Text Constants
const TOP_TEXT = 'Нужно что-то помощнее?'
const BOTTOM_TEXT = 'Забери свой "Black Prince"\nбесплатно прямо сейчас'
const BUTTON_TEXT = 'ЗАБРАТЬ'
const OFFER_LINK = 'https://www.worldofseabattle.com'

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
        topText.textContent = TOP_TEXT
        topText.style.color = '#FFFFFF'
        topText.style.fontSize = '34px'
        topText.style.fontWeight = 'bold'
        topText.style.margin = '0 0 30px 0'
        topText.style.textShadow = '3px 3px 6px rgba(0, 0, 0, 0.8)'
        topText.style.letterSpacing = '2px'

        // --- Logo + Button Container ---
        const logoButtonContainer = document.createElement('div')
        logoButtonContainer.style.position = 'relative'
        logoButtonContainer.style.display = 'inline-block'
        logoButtonContainer.style.width = '300px'
        logoButtonContainer.style.margin = '20px 0'

        // Create prince logo image
        const logoImage = document.createElement('img')
        logoImage.src = '/assets/ui/prince_nologo_glow.png'
        logoImage.style.width = '100%'
        logoImage.style.height = 'auto'
        logoImage.style.display = 'block'
        logoImage.style.filter = 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))'

        // Create button using btn.png
        const buttonContainer = document.createElement('div')
        buttonContainer.style.position = 'absolute'
        buttonContainer.style.left = '50%'
        buttonContainer.style.bottom = '75px'
        buttonContainer.style.transform = 'translateX(-50%) translateY(50%)'
        buttonContainer.style.cursor = 'pointer'
        buttonContainer.style.transition = 'transform 0.2s ease'
        buttonContainer.style.zIndex = '2'

        const buttonImage = document.createElement('img')
        buttonImage.src = '/assets/ui/btn.png'
        buttonImage.style.width = '200px'
        buttonImage.style.height = 'auto'
        buttonImage.style.filter = 'drop-shadow(0 4px 15px rgba(0, 0, 0, 0.5))'

        const buttonText = document.createElement('div')
        buttonText.textContent = BUTTON_TEXT
        buttonText.style.position = 'absolute'
        buttonText.style.top = '50%'
        buttonText.style.left = '50%'
        buttonText.style.transform = 'translate(-50%, -50%)'
        buttonText.style.color = '#FFFFFF'
        buttonText.style.fontSize = '18px'
        buttonText.style.fontWeight = 'bold'
        buttonText.style.paddingBottom = '6px'
        buttonText.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)'
        buttonText.style.pointerEvents = 'none'

        // Add hover effects to button
        buttonContainer.addEventListener('mouseenter', () => {
            buttonContainer.style.transform =
                'translateX(-50%) translateY(50%) scale(1.05)'
            buttonImage.style.filter =
                'drop-shadow(0 4px 15px rgba(0, 0, 0, 0.5)) brightness(1.1)'
        })

        buttonContainer.addEventListener('mouseleave', () => {
            buttonContainer.style.transform =
                'translateX(-50%) translateY(50%) scale(1)'
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

        // Assemble logo + button
        logoButtonContainer.appendChild(logoImage)
        logoButtonContainer.appendChild(buttonContainer)

        // Create text below image
        const bottomText = document.createElement('p')
        bottomText.textContent = BOTTOM_TEXT
        bottomText.style.color = '#FFFFFF'
        bottomText.style.fontSize = '24px'
        bottomText.style.margin = '30px 0 40px 0'
        bottomText.style.opacity = '0.95'
        bottomText.style.lineHeight = '1.5'
        bottomText.style.whiteSpace = 'pre-line'
        bottomText.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)'

        // Assemble the UI
        contentContainer.appendChild(topText)
        contentContainer.appendChild(logoButtonContainer)
        contentContainer.appendChild(bottomText)
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
        // Open the app store or desired link in a new tab
        window.open(OFFER_LINK, '_blank')
    }

    cleanup(): void {
        if (this.offerUI?.parentNode) {
            this.offerUI.parentNode.removeChild(this.offerUI)
        }
        this.isUICreated = false
    }
}
