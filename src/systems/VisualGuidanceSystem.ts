import type { Camera } from 'three'
import { Vector3 } from 'three'
import type {
    PositionComponent,
    RenderableComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class VisualGuidanceSystem extends System {
    private camera: Camera
    private canvas: HTMLCanvasElement
    private arrowContainer: HTMLElement | null = null
    private rangeIndicator: HTMLElement | null = null
    private isUICreated = false
    private arrows: HTMLElement[] = []

    constructor(world: World, camera: Camera, canvas: HTMLCanvasElement) {
        super(world, ['player', 'position', 'weapon'])
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
        const playerPosition =
            player.getComponent<PositionComponent>('position')
        const playerWeapon = player.getComponent<WeaponComponent>('weapon')
        const playerRenderable =
            player.getComponent<RenderableComponent>('renderable')

        if (!playerPosition || !playerWeapon || !playerRenderable?.mesh) {
            this.hideUI()
            return
        }

        // Update shooting range indicator
        this.updateRangeIndicator(
            playerPosition,
            playerWeapon,
            playerRenderable,
        )

        // Update enemy direction arrows
        this.updateEnemyArrows(playerPosition, playerRenderable)

        this.showUI()
    }

    private createUI(): void {
        if (this.isUICreated) return

        // Create container for arrows
        this.arrowContainer = document.createElement('div')
        this.arrowContainer.style.position = 'absolute'
        this.arrowContainer.style.pointerEvents = 'none'
        this.arrowContainer.style.zIndex = '999'
        this.arrowContainer.style.display = 'none'
        document.body.appendChild(this.arrowContainer)

        // Create shooting range indicator
        this.rangeIndicator = document.createElement('div')
        this.rangeIndicator.style.position = 'absolute'
        this.rangeIndicator.style.pointerEvents = 'none'
        this.rangeIndicator.style.zIndex = '998'
        this.rangeIndicator.style.border = '2px solid rgba(0, 150, 255, 0.5)'
        this.rangeIndicator.style.borderRadius = '50%'
        this.rangeIndicator.style.display = 'none'
        document.body.appendChild(this.rangeIndicator)

        this.isUICreated = true
    }

    private updateRangeIndicator(
        playerPosition: PositionComponent,
        playerWeapon: WeaponComponent,
        playerRenderable: RenderableComponent,
    ): void {
        if (!this.rangeIndicator || !playerRenderable.mesh) return

        // Convert world position to screen position
        const worldPos = new Vector3(
            playerPosition.x,
            playerPosition.y,
            playerPosition.z,
        )
        const screenPos = worldPos.clone().project(this.camera)

        // Convert normalized device coordinates to screen coordinates
        const canvasRect = this.canvas.getBoundingClientRect()
        const screenX =
            (screenPos.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left
        const screenY =
            (screenPos.y * -0.5 + 0.5) * canvasRect.height + canvasRect.top

        // Calculate the range indicator size in screen space
        // We need to convert the weapon range from world units to screen pixels
        const rangeInWorldUnits = playerWeapon.range

        // Create a point at the edge of the range to determine screen size
        const edgePoint = new Vector3(
            playerPosition.x + rangeInWorldUnits,
            playerPosition.y,
            playerPosition.z,
        )
        const edgeScreenPos = edgePoint.clone().project(this.camera)
        const edgeScreenX =
            (edgeScreenPos.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left

        const radiusInPixels = Math.abs(edgeScreenX - screenX)

        // Position and size the range indicator
        const diameter = radiusInPixels * 2
        this.rangeIndicator.style.width = `${diameter}px`
        this.rangeIndicator.style.height = `${diameter}px`
        this.rangeIndicator.style.left = `${screenX - radiusInPixels}px`
        this.rangeIndicator.style.top = `${screenY - radiusInPixels}px`
        this.rangeIndicator.style.display = 'block'
    }

    private updateEnemyArrows(
        playerPosition: PositionComponent,
        playerRenderable: RenderableComponent,
    ): void {
        if (!this.arrowContainer || !playerRenderable.mesh) return

        // Get all enemy entities
        const enemies = this.world.getEntitiesWithComponents([
            'enemy',
            'position',
        ])

        // Clear existing arrows
        this.clearArrows()

        // Create arrows for each enemy
        for (const enemy of enemies) {
            const enemyPosition =
                enemy.getComponent<PositionComponent>('position')
            if (!enemyPosition) continue

            this.createArrowToEnemy(
                playerPosition,
                enemyPosition,
                playerRenderable,
            )
        }
    }

    private createArrowToEnemy(
        playerPosition: PositionComponent,
        enemyPosition: PositionComponent,
        playerRenderable: RenderableComponent,
    ): void {
        if (!this.arrowContainer || !playerRenderable.mesh) return

        // Calculate direction vector from player to enemy
        const directionX = enemyPosition.x - playerPosition.x
        const directionY = enemyPosition.y - playerPosition.y
        const distance = Math.sqrt(
            directionX * directionX + directionY * directionY,
        )

        if (distance === 0) return

        // Normalize direction
        const normalizedX = directionX / distance
        const normalizedY = directionY / distance

        // Convert player position to screen position
        const worldPos = new Vector3(
            playerPosition.x,
            playerPosition.y,
            playerPosition.z,
        )
        const screenPos = worldPos.clone().project(this.camera)

        // Convert normalized device coordinates to screen coordinates
        const canvasRect = this.canvas.getBoundingClientRect()
        const screenX =
            (screenPos.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left
        const screenY =
            (screenPos.y * -0.5 + 0.5) * canvasRect.height + canvasRect.top

        // Calculate arrow position around the player ship
        const arrowDistance = 60 // Distance from player center to arrow position
        const arrowX = screenX + normalizedX * arrowDistance
        const arrowY = screenY + normalizedY * arrowDistance

        // Calculate rotation angle for the arrow
        const angle = Math.atan2(normalizedY, normalizedX)

        // Create arrow element
        const arrow = document.createElement('div')
        arrow.style.position = 'absolute'
        arrow.style.width = '0'
        arrow.style.height = '0'
        arrow.style.borderLeft = '8px solid transparent'
        arrow.style.borderRight = '8px solid transparent'
        arrow.style.borderBottom = '20px solid #ff0000'
        arrow.style.transform = `translate(-50%, -50%) rotate(${angle + Math.PI / 2}rad)`
        arrow.style.left = `${arrowX}px`
        arrow.style.top = `${arrowY}px`
        arrow.style.pointerEvents = 'none'
        arrow.style.zIndex = '999'

        this.arrowContainer.appendChild(arrow)
        this.arrows.push(arrow)
    }

    private clearArrows(): void {
        for (const arrow of this.arrows) {
            if (arrow.parentNode) {
                arrow.parentNode.removeChild(arrow)
            }
        }
        this.arrows = []
    }

    private showUI(): void {
        if (this.arrowContainer) {
            this.arrowContainer.style.display = 'block'
        }
        if (this.rangeIndicator) {
            this.rangeIndicator.style.display = 'block'
        }
    }

    private hideUI(): void {
        if (this.arrowContainer) {
            this.arrowContainer.style.display = 'none'
        }
        if (this.rangeIndicator) {
            this.rangeIndicator.style.display = 'none'
        }
        this.clearArrows()
    }

    cleanup(): void {
        this.clearArrows()
        if (this.arrowContainer) {
            document.body.removeChild(this.arrowContainer)
            this.arrowContainer = null
        }
        if (this.rangeIndicator) {
            document.body.removeChild(this.rangeIndicator)
            this.rangeIndicator = null
        }
        this.isUICreated = false
    }
}
