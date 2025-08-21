import type { GameStateComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import { LocalizationManager } from '../localization/LocalizationManager'
import type { GameStateSystem } from './GameStateSystem'

const OFFER_LINK = 'https://www.worldofseabattle.com'

export class NewShipOfferUISystem extends System {
    private offerUI: HTMLElement | null = null
    private contentContainer: HTMLElement | null = null
    private textContainer: HTMLElement | null = null
    private text1: HTMLElement | null = null
    private text2: HTMLElement | null = null
    private text3: HTMLElement | null = null
    private logoButtonContainer: HTMLElement | null = null
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
        this.offerUI.style.backgroundColor = 'rgba(0, 22, 64, 0.6)'
        this.offerUI.style.display = 'flex'
        this.offerUI.style.justifyContent = 'center'
        this.offerUI.style.alignItems = 'center'
        this.offerUI.style.zIndex = '10000'
        this.offerUI.style.fontFamily = 'Arial, sans-serif'
        this.offerUI.style.opacity = '0'
        this.offerUI.style.visibility = 'hidden'
        this.offerUI.style.transition =
            'opacity 0.3s ease-out, visibility 0.3s ease-out'

        // Create main content container with responsive flexbox
        this.contentContainer = document.createElement('div')
        this.contentContainer.style.display = 'flex'
        this.contentContainer.style.flexDirection = 'column'
        this.contentContainer.style.alignItems = 'center'
        this.contentContainer.style.justifyContent = 'space-between'
        this.contentContainer.style.textAlign = 'center'
        this.contentContainer.style.maxWidth = 'min(500px, 90vw)'
        this.contentContainer.style.width = '90%'
        this.contentContainer.style.height = 'min(80vh, 600px)'
        this.contentContainer.style.minHeight = '400px'
        this.contentContainer.style.transform = 'scale(0.8) translateY(30px)'
        this.contentContainer.style.transition =
            'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'

        // Create text container
        this.textContainer = document.createElement('div')
        this.textContainer.style.display = 'flex'
        this.textContainer.style.flexDirection = 'column'
        this.textContainer.style.alignItems = 'center'
        this.textContainer.style.gap = '4px'
        this.textContainer.style.opacity = '1'
        // --- Logo + Button Container ---
        this.logoButtonContainer = document.createElement('div')
        this.logoButtonContainer.style.position = 'relative'
        this.logoButtonContainer.style.display = 'inline-block'
        this.logoButtonContainer.style.width = 'min(340px, 76vw)'
        this.logoButtonContainer.style.height = 'auto'
        this.logoButtonContainer.style.margin = 'clamp(15px, 2vh, 20px) 0'
        this.logoButtonContainer.style.opacity = '0'
        this.logoButtonContainer.style.transform = 'scale(0.9)'
        this.logoButtonContainer.style.transition =
            'opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
        this.logoButtonContainer.style.flexShrink = '0'

        // Create prince logo image with responsive scaling
        const logoImage = document.createElement('img')
        logoImage.src = 'assets/ui/prince_nologo_glow.png'
        logoImage.style.width = '100%'
        logoImage.style.height = 'auto'
        logoImage.style.display = 'block'
        logoImage.style.filter = 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))'
        logoImage.style.maxHeight = 'clamp(300px, 52vh, 420px)'
        logoImage.style.objectFit = 'contain'
        logoImage.style.padding = '0 1% 20px 1%'

        // Create button using btn.png - positioned on the image as before
        const buttonContainer = document.createElement('div')
        buttonContainer.style.position = 'absolute'
        buttonContainer.style.left = '50%'
        buttonContainer.style.bottom = 'clamp(40px, 12%, 75px)'
        buttonContainer.style.transform = 'translateX(-50%) translateY(50%)'
        buttonContainer.style.width = '100%'
        buttonContainer.style.cursor = 'pointer'
        buttonContainer.style.transition = 'transform 0.2s ease'
        buttonContainer.style.zIndex = '2'

        const buttonImage = document.createElement('img')
        buttonImage.src = 'assets/ui/btn.png'
        buttonImage.style.width = '100%'
        buttonImage.style.height = 'auto'
        buttonImage.style.position = 'relative'
        buttonImage.style.left = '50%'
        buttonImage.style.transform = 'translateX(-50%)'
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
        buttonText.style.fontSize = 'clamp(24px, 4.2vw, 36px)'
        buttonText.style.fontWeight = 'bold'
        buttonText.style.paddingTop = '8px'
        buttonText.style.pointerEvents = 'none'
        buttonText.style.whiteSpace = 'nowrap'

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

        // Create first text element - "Get your"
        this.text1 = document.createElement('h2')
        this.text1.textContent =
            this.localizationManager.getText('newShipOffer.text1')
        this.text1.style.color = '#FFFFFF'
        this.text1.style.fontSize = 'clamp(20px, 3.5vw, 28px)'
        this.text1.style.fontWeight = 'normal'
        this.text1.style.margin = '0'
        this.text1.style.padding = '0'
        this.text1.style.textShadow = '2px 2px 10px rgba(0, 0, 0, 0.5)'
        this.text1.style.letterSpacing = '1px'
        this.text1.style.opacity = '0'
        this.text1.style.transform = 'translateY(-20px)'
        this.text1.style.transition =
            'opacity 0.5s ease-out, transform 0.5s ease-out'
        this.text1.style.flexShrink = '0'
        this.text1.style.maxWidth = '100%'
        this.text1.style.wordWrap = 'break-word'

        // Create second text element - "Black Prince" (big text)
        this.text2 = document.createElement('h1')
        this.text2.textContent = `"${this.localizationManager.getText('newShipOffer.text2')}"`
        this.text2.style.color = '#FFFFFF'
        this.text2.style.fontSize = 'clamp(28px, 5vw, 42px)'
        this.text2.style.fontWeight = 'bold'
        this.text2.style.margin = '0'
        this.text2.style.padding = '0'
        this.text2.style.textShadow = '2px 2px 10px rgba(0, 0, 0, 0.5)'
        this.text2.style.letterSpacing = '2px'
        this.text2.style.opacity = '0'
        this.text2.style.transform = 'translateY(-20px)'
        this.text2.style.transition =
            'opacity 0.6s ease-out, transform 0.6s ease-out'
        this.text2.style.flexShrink = '0'
        this.text2.style.maxWidth = '100%'
        this.text2.style.wordWrap = 'break-word'

        // Create third text element - "for free right now\nto win next battle"
        this.text3 = document.createElement('p')
        this.text3.textContent =
            this.localizationManager.getText('newShipOffer.text3')
        this.text3.style.color = '#FFFFFF'
        this.text3.style.fontSize = 'clamp(18px, 3vw, 24px)'
        this.text3.style.margin = '0'
        this.text3.style.padding = '0'
        this.text3.style.opacity = '0'
        this.text3.style.lineHeight = '1.2'
        this.text3.style.whiteSpace = 'pre-line'
        this.text3.style.textShadow = '2px 2px 10px rgba(0, 0, 0, 0.5)'
        this.text3.style.transform = 'translateY(20px)'
        this.text3.style.transition =
            'opacity 0.7s ease-out, transform 0.7s ease-out'
        this.text3.style.flexShrink = '0'
        this.text3.style.maxWidth = '100%'
        this.text3.style.wordWrap = 'break-word'

        // Assemble the UI (image first, then grouped texts)
        this.textContainer.appendChild(this.text1)
        this.textContainer.appendChild(this.text2)
        this.textContainer.appendChild(this.text3)

        this.contentContainer.appendChild(this.logoButtonContainer)
        this.contentContainer.appendChild(this.textContainer)
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

            // Stagger animations: image first, then texts
            setTimeout(() => {
                if (this.logoButtonContainer) {
                    this.logoButtonContainer.style.opacity = '1'
                    this.logoButtonContainer.style.transform = 'scale(1)'
                }
            }, 300)

            setTimeout(() => {
                if (this.textContainer) {
                    // cascade texts quickly
                    if (this.text1) {
                        this.text1.style.opacity = '1'
                        this.text1.style.transform = 'translateY(0)'
                    }
                    setTimeout(() => {
                        if (this.text2) {
                            this.text2.style.opacity = '1'
                            this.text2.style.transform = 'translateY(0)'
                        }
                    }, 120)
                    setTimeout(() => {
                        if (this.text3) {
                            this.text3.style.opacity = '1'
                            this.text3.style.transform = 'translateY(0)'
                        }
                    }, 240)
                }
            }, 500)
        }
    }

    private hideUI(): void {
        if (this.offerUI && this.isVisible) {
            this.isVisible = false

            // Reset all animations to initial state
            if (this.text1) {
                this.text1.style.opacity = '0'
                this.text1.style.transform = 'translateY(-20px)'
            }

            if (this.text2) {
                this.text2.style.opacity = '0'
                this.text2.style.transform = 'translateY(-20px)'
            }

            if (this.logoButtonContainer) {
                this.logoButtonContainer.style.opacity = '0'
                this.logoButtonContainer.style.transform = 'scale(0.9)'
            }

            if (this.text3) {
                this.text3.style.opacity = '0'
                this.text3.style.transform = 'translateY(20px)'
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
