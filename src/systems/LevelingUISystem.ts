import type { Camera, Scene } from 'three'
import { Vector3 } from 'three'
import { calculateNextLevelXP } from '../config/LevelingConfig'
import type {
    LevelComponent,
    PositionComponent,
    RenderableComponent,
    XPComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class LevelingUISystem extends System {
    private scene: Scene
    private camera: Camera
    private canvas: HTMLCanvasElement
    private uiContainer: HTMLElement | null = null
    private levelDisplay: HTMLElement | null = null
    private xpBar: HTMLElement | null = null
    private xpText: HTMLElement | null = null
    private isUICreated = false

    constructor(
        world: World,
        scene: Scene,
        camera: Camera,
        canvas: HTMLCanvasElement,
    ) {
        super(world, ['player', 'xp', 'level', 'position', 'renderable'])
        this.scene = scene
        this.camera = camera
        this.canvas = canvas
    }

    init(): void {
        this.createUI()
    }

    update(_deltaTime: number): void {
        const playerEntities = this.getEntities()

        if (playerEntities.length === 0) {
            this.hideUI()
            return
        }

        const player = playerEntities[0]
        const xp = player.getComponent<XPComponent>('xp')
        const level = player.getComponent<LevelComponent>('level')
        const position = player.getComponent<PositionComponent>('position')
        const renderable =
            player.getComponent<RenderableComponent>('renderable')

        if (!xp || !level || !position || !renderable?.mesh) {
            this.hideUI()
            return
        }

        // Update UI content
        this.updateLevelDisplay(level.currentLevel)
        this.updateXPBar(xp.currentXP, level.currentLevel, level.maxLevel)

        // Position UI above player ship
        this.positionUI(position, renderable)
        this.showUI()
    }

    private createUI(): void {
        if (this.isUICreated) return

        // Create UI container
        this.uiContainer = document.createElement('div')
        this.uiContainer.style.position = 'absolute'
        this.uiContainer.style.pointerEvents = 'none'
        this.uiContainer.style.zIndex = '1000'
        this.uiContainer.style.display = 'none'
        this.uiContainer.style.fontFamily = 'Arial, sans-serif'
        this.uiContainer.style.fontSize = '14px'
        this.uiContainer.style.color = 'white'
        this.uiContainer.style.textAlign = 'center'
        this.uiContainer.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)'

        // Create level display
        this.levelDisplay = document.createElement('div')
        this.levelDisplay.style.marginBottom = '4px'
        this.levelDisplay.style.fontWeight = 'bold'
        this.levelDisplay.style.fontSize = '16px'

        // Create XP bar container
        const xpBarContainer = document.createElement('div')
        xpBarContainer.style.width = '80px'
        xpBarContainer.style.height = '6px'
        xpBarContainer.style.backgroundColor = 'rgba(0,0,0,0.5)'
        xpBarContainer.style.border = '1px solid rgba(255,255,255,0.3)'
        xpBarContainer.style.borderRadius = '3px'
        xpBarContainer.style.overflow = 'hidden'
        xpBarContainer.style.margin = '0 auto'

        // Create XP bar fill
        this.xpBar = document.createElement('div')
        this.xpBar.style.height = '100%'
        this.xpBar.style.backgroundColor = '#4CAF50'
        this.xpBar.style.width = '0%'
        this.xpBar.style.transition = 'width 0.3s ease'
        this.xpBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)'

        // Create XP text
        this.xpText = document.createElement('div')
        this.xpText.style.fontSize = '10px'
        this.xpText.style.marginTop = '2px'
        this.xpText.style.opacity = '0.8'

        // Assemble UI
        xpBarContainer.appendChild(this.xpBar)
        this.uiContainer.appendChild(this.levelDisplay)
        this.uiContainer.appendChild(xpBarContainer)
        this.uiContainer.appendChild(this.xpText)

        // Add to page
        document.body.appendChild(this.uiContainer)
        this.isUICreated = true
    }

    private updateLevelDisplay(level: number): void {
        if (this.levelDisplay) {
            this.levelDisplay.textContent = `Level ${level}`
        }
    }

    private updateXPBar(
        currentXP: number,
        currentLevel: number,
        maxLevel: number,
    ): void {
        if (!this.xpBar || !this.xpText) return

        if (currentLevel >= maxLevel) {
            // Max level reached
            this.xpBar.style.width = '100%'
            this.xpBar.style.backgroundColor = '#FFD700' // Gold color for max level
            this.xpText.textContent = 'MAX LEVEL'
        } else {
            const nextLevelXP = calculateNextLevelXP(currentLevel)
            const progress = Math.min(currentXP / nextLevelXP, 1)

            this.xpBar.style.width = `${progress * 100}%`
            this.xpText.textContent = `${currentXP} / ${nextLevelXP} XP`
        }
    }

    private positionUI(
        position: PositionComponent,
        renderable: RenderableComponent,
    ): void {
        if (!this.uiContainer || !renderable.mesh) return

        // Get the ship's world position
        const shipPosition = new Vector3(position.x, position.y, position.z)

        // Add some height offset above the ship
        shipPosition.y += 2.0

        // Project world position to screen coordinates
        const screenPosition = shipPosition.clone().project(this.camera)

        // Convert normalized device coordinates to screen pixels
        const canvasRect = this.canvas.getBoundingClientRect()
        const x =
            (screenPosition.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left
        const y =
            (1 - (screenPosition.y * 0.5 + 0.5)) * canvasRect.height +
            canvasRect.top

        // Position UI element
        this.uiContainer.style.left = `${x}px`
        this.uiContainer.style.top = `${y}px`
        this.uiContainer.style.transform = 'translate(-50%, -100%)' // Center horizontally, place above
    }

    private showUI(): void {
        if (this.uiContainer) {
            this.uiContainer.style.display = 'block'
        }
    }

    private hideUI(): void {
        if (this.uiContainer) {
            this.uiContainer.style.display = 'none'
        }
    }

    cleanup(): void {
        if (this.uiContainer && this.uiContainer.parentNode) {
            this.uiContainer.parentNode.removeChild(this.uiContainer)
        }
        this.isUICreated = false
    }
}
