import type { InputComponent, MovementConfigComponent } from '../ecs/Component'
import { System } from '../ecs/System'

import type { World } from '../ecs/World'

export class InputSystem extends System {
    private canvas: HTMLCanvasElement
    private keysPressed: Set<string> = new Set()
    private pointerPosition: { x: number; y: number } = { x: 0, y: 0 }
    private isPointerDown: boolean = false
    private isTouching: boolean = false

    constructor(world: World, canvas: HTMLCanvasElement) {
        super(world, ['input', 'movementConfig']) // Requires entities with input and movement config
        this.canvas = canvas
    }

    init(): void {
        this.setupEventListeners()
    }

    private setupEventListeners(): void {
        // Keyboard events
        window.addEventListener('keydown', this.onKeyDown.bind(this))
        window.addEventListener('keyup', this.onKeyUp.bind(this))

        // Mouse events
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
        this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this))

        // Touch events
        this.canvas.addEventListener(
            'touchstart',
            this.onTouchStart.bind(this),
            { passive: false },
        )
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), {
            passive: false,
        })
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), {
            passive: false,
        })

        // Prevent context menu on right-click/long press
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    }

    // Keyboard event handlers
    private onKeyDown(event: KeyboardEvent): void {
        this.keysPressed.add(event.code.toLowerCase())
    }

    private onKeyUp(event: KeyboardEvent): void {
        this.keysPressed.delete(event.code.toLowerCase())
    }

    // Mouse event handlers
    private onMouseDown(event: MouseEvent): void {
        this.isPointerDown = true
        this.updatePointerPosition(event.clientX, event.clientY)
    }

    private onMouseUp(_event: MouseEvent): void {
        this.isPointerDown = false
    }

    private onMouseMove(event: MouseEvent): void {
        this.updatePointerPosition(event.clientX, event.clientY)
    }

    private onMouseLeave(_event: MouseEvent): void {
        this.isPointerDown = false
    }

    // Touch event handlers
    private onTouchStart(event: TouchEvent): void {
        event.preventDefault()
        this.isTouching = true
        if (event.touches.length > 0) {
            const touch = event.touches[0]
            this.updatePointerPosition(touch.clientX, touch.clientY)
        }
    }

    private onTouchEnd(event: TouchEvent): void {
        event.preventDefault()
        this.isTouching = false
    }

    private onTouchMove(event: TouchEvent): void {
        event.preventDefault()
        if (event.touches.length > 0) {
            const touch = event.touches[0]
            this.updatePointerPosition(touch.clientX, touch.clientY)
        }
    }

    private updatePointerPosition(clientX: number, clientY: number): void {
        const rect = this.canvas.getBoundingClientRect()
        // Normalize coordinates to -1 to 1 range
        this.pointerPosition.x = ((clientX - rect.left) / rect.width) * 2 - 1
        this.pointerPosition.y = -(((clientY - rect.top) / rect.height) * 2 - 1) // Invert Y for screen coords
    }

    private isKeyPressed(keyCode: string): boolean {
        return this.keysPressed.has(keyCode.toLowerCase())
    }

    update(_deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const input = entity.getComponent<InputComponent>('input')
            const config =
                entity.getComponent<MovementConfigComponent>('movementConfig')
            if (!input || !config) continue

            // Update raw keyboard input (WASD and Arrow keys only)
            input.moveForward =
                this.isKeyPressed('keyw') || this.isKeyPressed('arrowup')
            input.moveBackward =
                this.isKeyPressed('keys') || this.isKeyPressed('arrowdown')
            input.moveLeft =
                this.isKeyPressed('keya') || this.isKeyPressed('arrowleft')
            input.moveRight =
                this.isKeyPressed('keyd') || this.isKeyPressed('arrowright')

            // Update pointer/touch input
            input.pointerX = this.pointerPosition.x
            input.pointerY = this.pointerPosition.y
            input.isPointerDown = this.isPointerDown
            input.isTouching = this.isTouching

            // Process input into direction vectors
            this.processInputToDirection(input, config)
        }
    }

    private processInputToDirection(
        input: InputComponent,
        config: MovementConfigComponent,
    ): void {
        // Reset direction
        input.direction.x = 0
        input.direction.y = 0

        // Process keyboard input to direction
        this.processKeyboardDirection(input)

        // Process pointer input to direction
        this.processPointerDirection(input, config)

        // Apply responsiveness
        input.direction.x *= config.inputResponsiveness
        input.direction.y *= config.inputResponsiveness

        // Clamp values to [-1, 1]
        input.direction.x = this.clamp(input.direction.x, -1, 1)
        input.direction.y = this.clamp(input.direction.y, -1, 1)

        // Update input state
        input.hasInput =
            Math.abs(input.direction.x) > 0.01 ||
            Math.abs(input.direction.y) > 0.01
    }

    private processKeyboardDirection(input: InputComponent): void {
        // Forward/Backward movement (Y direction)
        if (input.moveForward) {
            input.direction.y += 1
        }
        if (input.moveBackward) {
            input.direction.y -= 1
        }

        // Left/Right movement (X direction)
        if (input.moveLeft) {
            input.direction.x += 1
        }
        if (input.moveRight) {
            input.direction.x -= 1
        }
    }

    private processPointerDirection(
        input: InputComponent,
        config: MovementConfigComponent,
    ): void {
        // Only process pointer input if touching or mouse is down
        if (!input.isTouching && !input.isPointerDown) return

        // Apply dead zone
        const pointerX =
            Math.abs(input.pointerX) > config.inputDeadZone ? input.pointerX : 0
        const pointerY =
            Math.abs(input.pointerY) > config.inputDeadZone ? input.pointerY : 0

        // Pointer X affects strafe movement
        if (pointerX !== 0) {
            input.direction.x += pointerX * config.pointerSensitivity
        }

        // Pointer Y affects forward movement
        if (pointerY !== 0) {
            input.direction.y += pointerY * config.pointerSensitivity
        }

        // Automatic forward movement when touching/clicking
        input.direction.y += config.pointerSensitivity * 0.5
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value))
    }

    cleanup(): void {
        // Remove event listeners
        window.removeEventListener('keydown', this.onKeyDown.bind(this))
        window.removeEventListener('keyup', this.onKeyUp.bind(this))

        this.canvas.removeEventListener(
            'mousedown',
            this.onMouseDown.bind(this),
        )
        this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this))
        this.canvas.removeEventListener(
            'mousemove',
            this.onMouseMove.bind(this),
        )
        this.canvas.removeEventListener(
            'mouseleave',
            this.onMouseLeave.bind(this),
        )

        this.canvas.removeEventListener(
            'touchstart',
            this.onTouchStart.bind(this),
        )
        this.canvas.removeEventListener('touchend', this.onTouchEnd.bind(this))
        this.canvas.removeEventListener(
            'touchmove',
            this.onTouchMove.bind(this),
        )
    }
}
