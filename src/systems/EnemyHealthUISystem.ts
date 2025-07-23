import type { Camera } from 'three'
import { Vector3 } from 'three'
import type {
    HealthComponent,
    PositionComponent,
    RenderableComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

interface EnemyHealthUI {
    entityId: number
    container: HTMLElement
    healthBarFiller: HTMLImageElement
}

export class EnemyHealthUISystem extends System {
    private camera: Camera
    private canvas: HTMLCanvasElement
    private enemyUIMap: Map<number, EnemyHealthUI> = new Map()

    constructor(world: World, camera: Camera, canvas: HTMLCanvasElement) {
        super(world, ['enemy', 'health', 'position', 'renderable'])
        this.camera = camera
        this.canvas = canvas
    }

    update(_deltaTime: number): void {
        const enemyEntities = this.getEntities()
        const activeEnemyIds = new Set<number>()

        for (const enemy of enemyEntities) {
            const health = enemy.getComponent<HealthComponent>('health')
            const position = enemy.getComponent<PositionComponent>('position')
            const renderable =
                enemy.getComponent<RenderableComponent>('renderable')

            if (!health || !position || !renderable?.mesh) continue

            activeEnemyIds.add(enemy.id)

            if (health.isDead) {
                this.removeEnemyUI(enemy.id)
                continue
            }

            let enemyUI = this.enemyUIMap.get(enemy.id)
            if (!enemyUI) {
                enemyUI = this.createEnemyUI(enemy.id)
                this.enemyUIMap.set(enemy.id, enemyUI)
            }

            this.updateHealthBar(
                enemyUI,
                health.currentHealth,
                health.maxHealth,
            )

            this.positionUI(enemyUI, position, renderable)

            enemyUI.container.style.display = 'block'
        }

        for (const [entityId, _] of this.enemyUIMap.entries()) {
            if (!activeEnemyIds.has(entityId)) {
                this.removeEnemyUI(entityId)
            }
        }
    }

    private createEnemyUI(entityId: number): EnemyHealthUI {
        const container = document.createElement('div')
        container.style.position = 'absolute'
        container.style.pointerEvents = 'none'
        container.style.zIndex = '999'
        container.style.display = 'none'
        container.style.fontFamily = 'Arial, sans-serif'
        container.style.fontSize = '16px'
        container.style.color = 'white'
        container.style.textAlign = 'center'
        container.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)'

        const healthBarContainer = document.createElement('div')
        healthBarContainer.style.position = 'relative'
        healthBarContainer.style.width = '100px'
        healthBarContainer.style.height = '10px'
        healthBarContainer.style.margin = '0 auto 2px auto'

        const healthBarBg = document.createElement('img')
        healthBarBg.src = 'assets/ui/bar_bg.png'
        healthBarBg.style.width = '100%'
        healthBarBg.style.height = '100%'
        healthBarBg.style.position = 'absolute'
        healthBarBg.style.top = '0'
        healthBarBg.style.left = '0'

        const healthBarFiller = document.createElement('img')
        healthBarFiller.src = 'assets/ui/enemy_bar_filler.png'
        healthBarFiller.style.width = '100%'
        healthBarFiller.style.height = '100%'
        healthBarFiller.style.position = 'absolute'
        healthBarFiller.style.top = '0'
        healthBarFiller.style.left = '0'
        healthBarFiller.style.transition = 'clip-path 0.2s ease'

        healthBarContainer.appendChild(healthBarBg)
        healthBarContainer.appendChild(healthBarFiller)
        container.appendChild(healthBarContainer)

        document.body.appendChild(container)

        return {
            entityId,
            container,
            healthBarFiller,
        }
    }

    private updateHealthBar(
        enemyUI: EnemyHealthUI,
        currentHealth: number,
        maxHealth: number,
    ): void {
        const healthPercent = Math.max(
            0,
            Math.min(1, currentHealth / maxHealth),
        )
        enemyUI.healthBarFiller.style.clipPath = `inset(0 ${(1 - healthPercent) * 100}% 0 0)`
    }

    private positionUI(
        enemyUI: EnemyHealthUI,
        position: PositionComponent,
        renderable: RenderableComponent,
    ): void {
        if (!renderable.mesh) return

        const enemyPosition = new Vector3(position.x, position.y, position.z)
        enemyPosition.y += 2

        const screenPosition = enemyPosition.clone().project(this.camera)

        if (screenPosition.z > 1) {
            enemyUI.container.style.display = 'none'
            return
        }

        const canvasRect = this.canvas.getBoundingClientRect()
        const x =
            (screenPosition.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left
        const y =
            (1 - (screenPosition.y * 0.5 + 0.5)) * canvasRect.height +
            canvasRect.top

        enemyUI.container.style.left = `${x}px`
        enemyUI.container.style.top = `${y}px`
        enemyUI.container.style.transform = 'translate(-50%, -100%)'
    }

    private removeEnemyUI(entityId: number): void {
        const enemyUI = this.enemyUIMap.get(entityId)
        if (enemyUI) {
            if (enemyUI.container.parentNode) {
                enemyUI.container.parentNode.removeChild(enemyUI.container)
            }
            this.enemyUIMap.delete(entityId)
        }
    }

    cleanup(): void {
        for (const [_, enemyUI] of this.enemyUIMap.entries()) {
            if (enemyUI.container.parentNode) {
                enemyUI.container.parentNode.removeChild(enemyUI.container)
            }
        }
        this.enemyUIMap.clear()
    }
}
