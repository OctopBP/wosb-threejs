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
    healthBar: HTMLElement
    healthText: HTMLElement
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

        // Update or create UI for each enemy
        for (const enemy of enemyEntities) {
            const health = enemy.getComponent<HealthComponent>('health')
            const position = enemy.getComponent<PositionComponent>('position')
            const renderable =
                enemy.getComponent<RenderableComponent>('renderable')

            if (!health || !position || !renderable?.mesh) continue

            activeEnemyIds.add(enemy.id)

            // Skip dead enemies
            if (health.isDead) {
                this.removeEnemyUI(enemy.id)
                continue
            }

            // Get or create UI for this enemy
            let enemyUI = this.enemyUIMap.get(enemy.id)
            if (!enemyUI) {
                enemyUI = this.createEnemyUI(enemy.id)
                this.enemyUIMap.set(enemy.id, enemyUI)
            }

            // Update health bar
            this.updateHealthBar(
                enemyUI,
                health.currentHealth,
                health.maxHealth,
            )

            // Position UI above enemy
            this.positionUI(enemyUI, position, renderable)

            // Show UI
            enemyUI.container.style.display = 'block'
        }

        // Remove UI for enemies that no longer exist
        for (const [entityId, _] of this.enemyUIMap.entries()) {
            if (!activeEnemyIds.has(entityId)) {
                this.removeEnemyUI(entityId)
            }
        }
    }

    private createEnemyUI(entityId: number): EnemyHealthUI {
        // Create UI container
        const container = document.createElement('div')
        container.style.position = 'absolute'
        container.style.pointerEvents = 'none'
        container.style.zIndex = '999'
        container.style.display = 'none'
        container.style.fontFamily = 'Arial, sans-serif'
        container.style.fontSize = '12px'
        container.style.color = 'white'
        container.style.textAlign = 'center'
        container.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)'

        // Create health bar container
        const healthBarContainer = document.createElement('div')
        healthBarContainer.style.width = '50px'
        healthBarContainer.style.height = '6px'
        healthBarContainer.style.backgroundColor = 'rgba(0,0,0,0.6)'
        healthBarContainer.style.border = '1px solid rgba(255,255,255,0.4)'
        healthBarContainer.style.borderRadius = '3px'
        healthBarContainer.style.overflow = 'hidden'
        healthBarContainer.style.margin = '0 auto 2px auto'

        // Create health bar fill
        const healthBar = document.createElement('div')
        healthBar.style.height = '100%'
        healthBar.style.width = '100%'
        healthBar.style.transition =
            'width 0.2s ease, background-color 0.2s ease'
        healthBar.style.background = 'linear-gradient(90deg, #FF6B6B, #FF8E8E)'

        // Create health text (optional, can be toggled)
        const healthText = document.createElement('div')
        healthText.style.fontSize = '9px'
        healthText.style.opacity = '0.8'
        healthText.style.display = 'none' // Hidden by default to reduce clutter

        // Assemble UI
        healthBarContainer.appendChild(healthBar)
        container.appendChild(healthBarContainer)
        container.appendChild(healthText)

        // Add to page
        document.body.appendChild(container)

        return {
            entityId,
            container,
            healthBar,
            healthText,
        }
    }

    private updateHealthBar(
        enemyUI: EnemyHealthUI,
        currentHealth: number,
        maxHealth: number,
    ): void {
        const healthPercent = Math.max(0, currentHealth) / maxHealth
        const healthWidth = `${healthPercent * 100}%`

        enemyUI.healthBar.style.width = healthWidth

        // Change color based on health percentage
        if (healthPercent > 0.6) {
            // Red (enemy healthy)
            enemyUI.healthBar.style.background =
                'linear-gradient(90deg, #FF6B6B, #FF8E8E)'
        } else if (healthPercent > 0.3) {
            // Orange (enemy wounded)
            enemyUI.healthBar.style.background =
                'linear-gradient(90deg, #FF9800, #FFB74D)'
        } else {
            // Dark red (enemy critical)
            enemyUI.healthBar.style.background =
                'linear-gradient(90deg, #D32F2F, #F44336)'
        }

        // Update text (if visible)
        enemyUI.healthText.textContent = `${Math.ceil(currentHealth)}`
    }

    private positionUI(
        enemyUI: EnemyHealthUI,
        position: PositionComponent,
        renderable: RenderableComponent,
    ): void {
        if (!renderable.mesh) return

        // Get the enemy's world position
        const enemyPosition = new Vector3(position.x, position.y, position.z)

        // Add some height offset above the enemy
        enemyPosition.y += 1.5

        // Project world position to screen coordinates
        const screenPosition = enemyPosition.clone().project(this.camera)

        // Check if enemy is behind camera
        if (screenPosition.z > 1) {
            enemyUI.container.style.display = 'none'
            return
        }

        // Convert normalized device coordinates to screen pixels
        const canvasRect = this.canvas.getBoundingClientRect()
        const x =
            (screenPosition.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left
        const y =
            (1 - (screenPosition.y * 0.5 + 0.5)) * canvasRect.height +
            canvasRect.top

        // Position UI element
        enemyUI.container.style.left = `${x}px`
        enemyUI.container.style.top = `${y}px`
        enemyUI.container.style.transform = 'translate(-50%, -100%)' // Center horizontally, place above
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
        // Remove all enemy UI elements
        for (const [_, enemyUI] of this.enemyUIMap.entries()) {
            if (enemyUI.container.parentNode) {
                enemyUI.container.parentNode.removeChild(enemyUI.container)
            }
        }
        this.enemyUIMap.clear()
    }
}
