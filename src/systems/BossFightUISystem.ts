import type { GameStateComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class BossFightUISystem extends System {
    private faderOverlay: HTMLElement | null = null
    private isUICreated = false

    constructor(world: World) {
        super(world, [])
    }

    update(_deltaTime: number): void {
        // Check if we should show the boss fight fader
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

        if (gameState.currentState === 'bossFight') {
            this.showUI()
        } else {
            this.hideUI()
        }
    }

    private showUI(): void {
        this.createUI()
        if (this.faderOverlay) {
            this.faderOverlay.style.display = 'block'
        }
    }

    private hideUI(): void {
        if (this.faderOverlay) {
            this.faderOverlay.style.display = 'none'
        }
    }

    private createUI(): void {
        if (this.isUICreated) return

        // Create full screen overlay with red fader image
        this.faderOverlay = document.createElement('div')
        this.faderOverlay.style.position = 'fixed'
        this.faderOverlay.style.top = '0'
        this.faderOverlay.style.left = '0'
        this.faderOverlay.style.width = '100%'
        this.faderOverlay.style.height = '100%'
        this.faderOverlay.style.display = 'none'
        this.faderOverlay.style.zIndex = '9999' // Below other UI systems but above game
        this.faderOverlay.style.pointerEvents = 'none' // Allow interaction with game underneath
        this.faderOverlay.style.backgroundImage =
            'url(/assets/ui/fader_red.png)'
        this.faderOverlay.style.backgroundSize = 'cover'
        this.faderOverlay.style.backgroundPosition = 'center'
        this.faderOverlay.style.backgroundRepeat = 'no-repeat'

        // Add to page
        document.body.appendChild(this.faderOverlay)
        this.isUICreated = true
    }
}
