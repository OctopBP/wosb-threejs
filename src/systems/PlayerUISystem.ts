import type { Camera } from 'three'
import { Vector3 } from 'three'
import { calculateNextLevelXP } from '../config/LevelingConfig'
import type {
    HealthComponent,
    LevelComponent,
    PositionComponent,
    RenderableComponent,
    XPComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class PlayerUISystem extends System {
    private camera: Camera
    private canvas: HTMLCanvasElement
    private uiContainer: HTMLElement | null = null
    private healthBar: HTMLElement | null = null
    private healthText: HTMLElement | null = null
    private levelDisplay: HTMLElement | null = null
    private xpBar: HTMLElement | null = null
    private xpText: HTMLElement | null = null
    private isUICreated = false

    constructor(world: World, camera: Camera, canvas: HTMLCanvasElement) {
        super(world, [
            'player',
            'health',
            'xp',
            'level',
            'position',
            'renderable',
        ])
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
        const health = player.getComponent<HealthComponent>('health')
        const xp = player.getComponent<XPComponent>('xp')
        const level = player.getComponent<LevelComponent>('level')
        const position = player.getComponent<PositionComponent>('position')
        const renderable =
            player.getComponent<RenderableComponent>('renderable')

        if (!health || !xp || !level || !position || !renderable?.mesh) {
            this.hideUI()
            return
        }

        // Update UI content
        this.updateHealthBar(health.currentHealth, health.maxHealth)
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
        this.uiContainer.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)'

        // Create main horizontal container
        const mainContainer = document.createElement('div')
        mainContainer.style.display = 'flex'
        mainContainer.style.alignItems = 'center'
        mainContainer.style.gap = '4px'

        // Create circular level display container
        const levelCircle = document.createElement('div')
        levelCircle.style.width = '30px'
        levelCircle.style.height = '30px'
        levelCircle.style.borderRadius = '50%'
        levelCircle.style.backgroundColor = 'rgba(0,0,0,0.8)'
        levelCircle.style.border = '2px solid rgba(255,255,255,0.6)'
        levelCircle.style.display = 'flex'
        levelCircle.style.flexDirection = 'column'
        levelCircle.style.alignItems = 'center'
        levelCircle.style.justifyContent = 'center'
        levelCircle.style.textAlign = 'center'

        // Create level number display
        this.levelDisplay = document.createElement('div')
        this.levelDisplay.style.fontWeight = 'bold'
        this.levelDisplay.style.fontSize = '14px'
        this.levelDisplay.style.lineHeight = '1'

        // Create "LVL" label
        const levelLabel = document.createElement('div')
        levelLabel.textContent = 'LVL'
        levelLabel.style.fontSize = '8px'
        levelLabel.style.opacity = '0.7'
        levelLabel.style.lineHeight = '1'

        // Assemble level circle
        levelCircle.appendChild(this.levelDisplay)
        levelCircle.appendChild(levelLabel)

        // Create bars container (right side)
        const barsContainer = document.createElement('div')
        barsContainer.style.display = 'flex'
        barsContainer.style.flexDirection = 'column'

        // Create health bar row
        const healthRow = document.createElement('div')
        healthRow.style.display = 'flex'
        healthRow.style.alignItems = 'center'
        healthRow.style.gap = '4px'

        // Create health bar container
        const healthBarContainer = document.createElement('div')
        healthBarContainer.style.width = '80px'
        healthBarContainer.style.height = '8px'
        healthBarContainer.style.backgroundColor = 'rgba(0,0,0,0.7)'
        healthBarContainer.style.border = '1px solid rgba(255,255,255,0.4)'
        healthBarContainer.style.borderRadius = '4px'
        healthBarContainer.style.overflow = 'hidden'

        // Create health bar fill
        this.healthBar = document.createElement('div')
        this.healthBar.style.height = '100%'
        this.healthBar.style.width = '100%'
        this.healthBar.style.transition =
            'width 0.3s ease, background-color 0.3s ease'
        this.healthBar.style.background =
            'linear-gradient(90deg, #4CAF50, #66BB6A)'

        // Create health text
        this.healthText = document.createElement('div')
        this.healthText.style.fontSize = '9px'
        this.healthText.style.opacity = '0.8'
        this.healthText.style.color = '#E8F5E8'
        this.healthText.style.minWidth = '50px'

        // Assemble health row
        healthBarContainer.appendChild(this.healthBar)
        healthRow.appendChild(healthBarContainer)
        healthRow.appendChild(this.healthText)

        // Create XP bar row
        const xpRow = document.createElement('div')
        xpRow.style.display = 'flex'
        xpRow.style.alignItems = 'center'
        xpRow.style.gap = '4px'

        // Create XP bar container
        const xpBarContainer = document.createElement('div')
        xpBarContainer.style.width = '80px'
        xpBarContainer.style.height = '6px'
        xpBarContainer.style.backgroundColor = 'rgba(0,0,0,0.5)'
        xpBarContainer.style.border = '1px solid rgba(255,255,255,0.3)'
        xpBarContainer.style.borderRadius = '3px'
        xpBarContainer.style.overflow = 'hidden'

        // Create XP bar fill
        this.xpBar = document.createElement('div')
        this.xpBar.style.height = '100%'
        this.xpBar.style.backgroundColor = '#FFC107'
        this.xpBar.style.width = '0%'
        this.xpBar.style.transition = 'width 0.3s ease'
        this.xpBar.style.background = 'linear-gradient(90deg, #FFC107, #FFD54F)'

        // Create XP text
        this.xpText = document.createElement('div')
        this.xpText.style.fontSize = '8px'
        this.xpText.style.opacity = '0.8'
        this.xpText.style.minWidth = '50px'

        // Assemble XP row
        xpBarContainer.appendChild(this.xpBar)
        xpRow.appendChild(xpBarContainer)
        xpRow.appendChild(this.xpText)

        // Assemble bars container
        barsContainer.appendChild(healthRow)
        barsContainer.appendChild(xpRow)

        // Assemble main container
        mainContainer.appendChild(levelCircle)
        mainContainer.appendChild(barsContainer)

        // Add main container to UI container
        this.uiContainer.appendChild(mainContainer)

        // Add to page
        document.body.appendChild(this.uiContainer)
        this.isUICreated = true
    }

    private updateHealthBar(currentHealth: number, maxHealth: number): void {
        if (!this.healthBar || !this.healthText) return

        const healthPercent = Math.max(0, currentHealth) / maxHealth
        const healthWidth = `${healthPercent * 100}%`

        this.healthBar.style.width = healthWidth

        // Change color based on health percentage
        if (healthPercent > 0.6) {
            // Green (healthy)
            this.healthBar.style.background =
                'linear-gradient(90deg, #4CAF50, #66BB6A)'
        } else if (healthPercent > 0.3) {
            // Yellow (warning)
            this.healthBar.style.background =
                'linear-gradient(90deg, #FFC107, #FFD54F)'
        } else {
            // Red (critical)
            this.healthBar.style.background =
                'linear-gradient(90deg, #F44336, #EF5350)'
        }

        // Update text
        this.healthText.textContent = `${Math.ceil(currentHealth)}/${maxHealth}`
    }

    private updateLevelDisplay(level: number): void {
        if (this.levelDisplay) {
            this.levelDisplay.textContent = `${level}`
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
            this.xpText.textContent = 'MAX'
        } else {
            const nextLevelXP = calculateNextLevelXP(currentLevel)
            const progress = Math.min(currentXP / nextLevelXP, 1)

            this.xpBar.style.width = `${progress * 100}%`
            this.xpText.textContent = `${currentXP}/${nextLevelXP}`
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
