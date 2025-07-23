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
    private healthBarFiller: HTMLImageElement | null = null
    private levelDisplay: HTMLElement | null = null
    private xpBarFiller: HTMLImageElement | null = null
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

        this.updateHealthBar(health.currentHealth, health.maxHealth)
        this.updateLevelDisplay(level.currentLevel)
        this.updateXPBar(xp.currentXP, level.currentLevel, level.maxLevel)

        this.positionUI(position, renderable)
        this.showUI()
    }

    private createUI(): void {
        if (this.isUICreated) return

        this.uiContainer = document.createElement('div')
        this.uiContainer.style.position = 'absolute'
        this.uiContainer.style.pointerEvents = 'none'
        this.uiContainer.style.zIndex = '1000'
        this.uiContainer.style.display = 'none'
        this.uiContainer.style.fontFamily = 'Arial, sans-serif'
        this.uiContainer.style.fontSize = '14px'
        this.uiContainer.style.color = 'white'
        this.uiContainer.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)'

        const mainContainer = document.createElement('div')
        mainContainer.style.display = 'flex'
        mainContainer.style.alignItems = 'center'
        mainContainer.style.gap = '0px'
        mainContainer.style.position = 'relative'
        mainContainer.style.height = '32px'

        const levelContainer = document.createElement('div')
        levelContainer.style.position = 'relative'
        levelContainer.style.width = '30px'
        levelContainer.style.height = '30px'
        levelContainer.style.zIndex = '2'

        const levelBackground = document.createElement('img')
        levelBackground.src = 'assets/ui/player_level.png'
        levelBackground.style.width = '100%'
        levelBackground.style.height = '100%'
        levelBackground.style.display = 'block'

        this.levelDisplay = document.createElement('div')
        this.levelDisplay.style.position = 'absolute'
        this.levelDisplay.style.top = '50%'
        this.levelDisplay.style.left = '50%'
        this.levelDisplay.style.transform = 'translate(-50%, -50%)'
        this.levelDisplay.style.fontWeight = 'bold'
        this.levelDisplay.style.fontSize = '12px'
        this.levelDisplay.style.textAlign = 'center'

        levelContainer.appendChild(levelBackground)
        levelContainer.appendChild(this.levelDisplay)

        const barsContainer = document.createElement('div')
        barsContainer.style.display = 'flex'
        barsContainer.style.flexDirection = 'column'
        barsContainer.style.marginLeft = '18px'
        barsContainer.style.zIndex = '1'
        barsContainer.style.minWidth = '100px'

        const healthRow = document.createElement('div')
        healthRow.style.position = 'relative'
        healthRow.style.width = '100px'
        healthRow.style.height = '12px'
        healthRow.style.marginBottom = '2px'

        const healthBarBg = document.createElement('img')
        healthBarBg.src = 'assets/ui/bar_bg.png'
        healthBarBg.style.width = '100%'
        healthBarBg.style.height = '100%'
        healthBarBg.style.position = 'absolute'
        healthBarBg.style.top = '0'
        healthBarBg.style.left = '0'

        this.healthBarFiller = document.createElement('img')
        this.healthBarFiller.src = 'assets/ui/player_bar_filler.png'
        this.healthBarFiller.style.width = '100%'
        this.healthBarFiller.style.height = '100%'
        this.healthBarFiller.style.position = 'absolute'
        this.healthBarFiller.style.top = '0'
        this.healthBarFiller.style.left = '0'
        this.healthBarFiller.style.transition = 'clip-path 0.3s ease'

        healthRow.appendChild(healthBarBg)
        healthRow.appendChild(this.healthBarFiller)

        const xpRow = document.createElement('div')
        xpRow.style.position = 'relative'
        xpRow.style.width = '100px'
        xpRow.style.height = '8px'

        const xpBarBg = document.createElement('img')
        xpBarBg.src = 'assets/ui/exp_bar_back.png'
        xpBarBg.style.width = '100%'
        xpBarBg.style.height = '100%'
        xpBarBg.style.position = 'absolute'
        xpBarBg.style.top = '0'
        xpBarBg.style.left = '0'

        this.xpBarFiller = document.createElement('img')
        this.xpBarFiller.src = 'assets/ui/exp_bar_filler.png'
        this.xpBarFiller.style.width = '100%'
        this.xpBarFiller.style.height = '100%'
        this.xpBarFiller.style.position = 'absolute'
        this.xpBarFiller.style.top = '0'
        this.xpBarFiller.style.left = '0'
        this.xpBarFiller.style.transition = 'clip-path 0.3s ease'

        xpRow.appendChild(xpBarBg)
        xpRow.appendChild(this.xpBarFiller)

        barsContainer.appendChild(healthRow)
        barsContainer.appendChild(xpRow)

        mainContainer.appendChild(levelContainer)
        mainContainer.appendChild(barsContainer)

        this.uiContainer.appendChild(mainContainer)

        document.body.appendChild(this.uiContainer)
        this.isUICreated = true
    }

    private updateHealthBar(currentHealth: number, maxHealth: number): void {
        if (!this.healthBarFiller) return

        const healthPercent = Math.max(
            0,
            Math.min(1, currentHealth / maxHealth),
        )
        this.healthBarFiller.style.clipPath = `inset(0 ${(1 - healthPercent) * 100}% 0 0)`
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
        if (!this.xpBarFiller) return

        let progress: number
        if (currentLevel >= maxLevel) {
            progress = 1
        } else {
            const nextLevelXP = calculateNextLevelXP(currentLevel)
            progress = Math.min(currentXP / nextLevelXP, 1)
        }

        this.xpBarFiller.style.clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`
    }

    private positionUI(
        position: PositionComponent,
        renderable: RenderableComponent,
    ): void {
        if (!this.uiContainer || !renderable.mesh) return

        const shipPosition = new Vector3(position.x, position.y, position.z)
        shipPosition.y += 2.0

        const screenPosition = shipPosition.clone().project(this.camera)

        const canvasRect = this.canvas.getBoundingClientRect()
        const x =
            (screenPosition.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left
        const y =
            (1 - (screenPosition.y * 0.5 + 0.5)) * canvasRect.height +
            canvasRect.top

        this.uiContainer.style.left = `${x}px`
        this.uiContainer.style.top = `${y}px`
        this.uiContainer.style.transform = 'translate(-50%, -100%)'
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
        if (this.uiContainer?.parentNode) {
            this.uiContainer.parentNode.removeChild(this.uiContainer)
        }
        this.isUICreated = false
    }
}
