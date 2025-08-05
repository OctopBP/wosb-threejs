import type { GameStateComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import { LocalizationManager } from '../localization/LocalizationManager'
import type { GameStateSystem } from './GameStateSystem'

const OFFER_LINK = 'https://www.worldofseabattle.com'

export class NewShipOfferUISystem extends System {
    private offerUI: HTMLElement | null = null
    private contentContainer: HTMLElement | null = null
    private topText: HTMLElement | null = null
    private logoButtonContainer: HTMLElement | null = null
    private bottomText: HTMLElement | null = null
    private isUICreated = false
    private gameStateSystem: GameStateSystem | null = null
    private isVisible = false
    private localizationManager: LocalizationManager

    constructor(world: World) {
        super(world, [])
        this.localizationManager = LocalizationManager.getInstance()
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
        this.offerUI.style.display = 'flex'
        this.offerUI.style.justifyContent = 'center'
        this.offerUI.style.alignItems = 'center'
        this.offerUI.style.flexDirection = 'column'
        this.offerUI.style.zIndex = '10000'
        this.offerUI.style.fontFamily = 'Arial, sans-serif'
        this.offerUI.style.opacity = '0'
        this.offerUI.style.visibility = 'hidden'
        this.offerUI.style.transition =
            'opacity 0.3s ease-out, visibility 0.3s ease-out'

        // Create main content container
        this.contentContainer = document.createElement('div')
        this.contentContainer.style.display = 'flex'
        this.contentContainer.style.flexDirection = 'column'
        this.contentContainer.style.alignItems = 'center'
        this.contentContainer.style.textAlign = 'center'
        this.contentContainer.style.maxWidth = '500px'
        this.contentContainer.style.width = '90%'
        this.contentContainer.style.transform = 'scale(0.8) translateY(30px)'
        this.contentContainer.style.transition =
            'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'

        // Create text above image
        this.topText = document.createElement('h1')
        this.topText.textContent = this.localizationManager.getText(
            'newShipOffer.topText',
        )
        this.topText.style.color = '#FFFFFF'
        this.topText.style.fontSize = '34px'
        this.topText.style.fontWeight = 'bold'
        this.topText.style.margin = '0 0 30px 0'
        this.topText.style.textShadow = '3px 3px 6px rgba(0, 0, 0, 0.8)'
        this.topText.style.letterSpacing = '2px'
        this.topText.style.opacity = '0'
        this.topText.style.transform = 'translateY(-20px)'
        this.topText.style.transition =
            'opacity 0.5s ease-out, transform 0.5s ease-out'

        // --- Logo + Button Container ---
        this.logoButtonContainer = document.createElement('div')
        this.logoButtonContainer.style.position = 'relative'
        this.logoButtonContainer.style.display = 'inline-block'
        this.logoButtonContainer.style.width = '300px'
        this.logoButtonContainer.style.margin = '20px 0'
        this.logoButtonContainer.style.opacity = '0'
        this.logoButtonContainer.style.transform = 'scale(0.9)'
        this.logoButtonContainer.style.transition =
            'opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'

        // Create prince logo image
        const logoImage = document.createElement('img')
        logoImage.src = 'assets/ui/prince_nologo_glow.png'
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
        buttonImage.src = 'assets/ui/btn.png'
        buttonImage.style.width = '200px'
        buttonImage.style.height = 'auto'
        buttonImage.style.filter = 'drop-shadow(0 4px 15px rgba(0, 0, 0, 0.5))'

        const buttonText = document.createElement('div')
        buttonText.textContent = this.localizationManager.getText(
            'newShipOffer.buttonText',
        )
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
        this.logoButtonContainer.appendChild(logoImage)
        this.logoButtonContainer.appendChild(buttonContainer)

        // Create text below image
        this.bottomText = document.createElement('p')
        this.bottomText.textContent = this.localizationManager.getText(
            'newShipOffer.bottomText',
        )
        this.bottomText.style.color = '#FFFFFF'
        this.bottomText.style.fontSize = '24px'
        this.bottomText.style.margin = '30px 0 40px 0'
        this.bottomText.style.opacity = '0'
        this.bottomText.style.lineHeight = '1.5'
        this.bottomText.style.whiteSpace = 'pre-line'
        this.bottomText.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)'
        this.bottomText.style.transform = 'translateY(20px)'
        this.bottomText.style.transition =
            'opacity 0.7s ease-out, transform 0.7s ease-out'

        // Assemble the UI
        this.contentContainer.appendChild(this.topText)
        this.contentContainer.appendChild(this.logoButtonContainer)
        this.contentContainer.appendChild(this.bottomText)
        this.offerUI.appendChild(this.contentContainer)

        // Add to page
        document.body.appendChild(this.offerUI)
        this.isUICreated = true
    }

    private showUI(): void {
        if (this.offerUI && !this.isVisible) {
            this.isVisible = true

            // Show the overlay
            this.offerUI.style.visibility = 'visible'
            this.offerUI.style.opacity = '1'

            // Animate content container
            setTimeout(() => {
                if (this.contentContainer) {
                    this.contentContainer.style.transform =
                        'scale(1) translateY(0)'
                }
            }, 100)

            // Stagger the text animations
            setTimeout(() => {
                if (this.topText) {
                    this.topText.style.opacity = '1'
                    this.topText.style.transform = 'translateY(0)'
                }
            }, 200)

            setTimeout(() => {
                if (this.logoButtonContainer) {
                    this.logoButtonContainer.style.opacity = '1'
                    this.logoButtonContainer.style.transform = 'scale(1)'
                }
            }, 400)

            setTimeout(() => {
                if (this.bottomText) {
                    this.bottomText.style.opacity = '1'
                    this.bottomText.style.transform = 'translateY(0)'
                }
            }, 600)
        }
    }

    private hideUI(): void {
        if (this.offerUI && this.isVisible) {
            this.isVisible = false

            // Reset all animations to initial state
            if (this.topText) {
                this.topText.style.opacity = '0'
                this.topText.style.transform = 'translateY(-20px)'
            }

            if (this.logoButtonContainer) {
                this.logoButtonContainer.style.opacity = '0'
                this.logoButtonContainer.style.transform = 'scale(0.9)'
            }

            if (this.bottomText) {
                this.bottomText.style.opacity = '0'
                this.bottomText.style.transform = 'translateY(20px)'
            }

            if (this.contentContainer) {
                this.contentContainer.style.transform =
                    'scale(0.8) translateY(30px)'
            }

            // Hide the overlay
            this.offerUI.style.opacity = '0'

            setTimeout(() => {
                if (this.offerUI) {
                    this.offerUI.style.visibility = 'hidden'
                }
            }, 300)
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
        this.isVisible = false
    }
}
