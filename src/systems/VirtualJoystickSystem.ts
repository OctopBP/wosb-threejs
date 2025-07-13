import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export interface JoystickInput {
    x: number // -1 to 1 (left/right)
    y: number // -1 to 1 (forward/backward)
    isActive: boolean
}

export class VirtualJoystickSystem extends System {
    private canvas: HTMLCanvasElement
    private joystickContainer: HTMLElement | null = null
    private joystickBase: HTMLElement | null = null
    private joystickKnob: HTMLElement | null = null
    private isJoystickActive = false
    private joystickPosition = { x: 0, y: 0 }
    private joystickInput: JoystickInput = { x: 0, y: 0, isActive: false }
    private joystickCenter = { x: 0, y: 0 }
    private joystickSize = 100
    private knobSize = 40
    private maxDistance = 35
    private isUICreated = false

    constructor(world: World, canvas: HTMLCanvasElement) {
        super(world, [])
        this.canvas = canvas
    }

    init(): void {
        this.createJoystickUI()
        this.setupEventListeners()
    }

    private createJoystickUI(): void {
        if (this.isUICreated) return

        // Create joystick container
        this.joystickContainer = document.createElement('div')
        this.joystickContainer.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 30px;
            width: ${this.joystickSize}px;
            height: ${this.joystickSize}px;
            z-index: 1000;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        `

        // Create joystick base
        this.joystickBase = document.createElement('div')
        this.joystickBase.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            border: 2px solid rgba(255,255,255,0.3);
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        `

        // Create joystick knob
        this.joystickKnob = document.createElement('div')
        this.joystickKnob.style.cssText = `
            position: absolute;
            width: ${this.knobSize}px;
            height: ${this.knobSize}px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%);
            border: 2px solid rgba(255,255,255,0.6);
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            transform: translate(-50%, -50%);
            transition: transform 0.1s ease-out;
            cursor: pointer;
        `

        // Position knob at center initially
        this.resetKnobPosition()

        // Assemble joystick
        this.joystickContainer.appendChild(this.joystickBase)
        this.joystickContainer.appendChild(this.joystickKnob)

        // Add to page
        document.body.appendChild(this.joystickContainer)

        this.isUICreated = true
    }

    private setupEventListeners(): void {
        if (!this.joystickContainer) return

        // Mouse events
        this.joystickContainer.addEventListener(
            'mousedown',
            this.onPointerStart.bind(this),
        )
        document.addEventListener('mousemove', this.onPointerMove.bind(this))
        document.addEventListener('mouseup', this.onPointerEnd.bind(this))

        // Touch events
        this.joystickContainer.addEventListener(
            'touchstart',
            this.onPointerStart.bind(this),
            { passive: false },
        )
        document.addEventListener('touchmove', this.onPointerMove.bind(this), {
            passive: false,
        })
        document.addEventListener('touchend', this.onPointerEnd.bind(this), {
            passive: false,
        })
    }

    private onPointerStart(event: MouseEvent | TouchEvent): void {
        event.preventDefault()
        this.isJoystickActive = true
        this.joystickInput.isActive = true

        // Get container position
        if (!this.joystickContainer) return
        const rect = this.joystickContainer.getBoundingClientRect()
        this.joystickCenter.x = rect.left + rect.width / 2
        this.joystickCenter.y = rect.top + rect.height / 2

        // Visual feedback
        if (this.joystickKnob) {
            this.joystickKnob.style.transform =
                'translate(-50%, -50%) scale(1.1)'
        }
        if (this.joystickBase) {
            this.joystickBase.style.borderColor = 'rgba(255,255,255,0.6)'
            this.joystickBase.style.background =
                'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)'
        }
    }

    private onPointerMove(event: MouseEvent | TouchEvent): void {
        if (!this.isJoystickActive) return

        event.preventDefault()

        let clientX: number
        let clientY: number
        if (event instanceof MouseEvent) {
            clientX = event.clientX
            clientY = event.clientY
        } else {
            if (event.touches.length === 0) return
            clientX = event.touches[0].clientX
            clientY = event.touches[0].clientY
        }

        // Calculate distance from center
        const dx = clientX - this.joystickCenter.x
        const dy = clientY - this.joystickCenter.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Clamp to max distance
        let finalX = dx
        let finalY = dy
        if (distance > this.maxDistance) {
            finalX = (dx / distance) * this.maxDistance
            finalY = (dy / distance) * this.maxDistance
        }

        // Update knob position
        if (this.joystickKnob) {
            this.joystickKnob.style.left = `${50 + (finalX / this.joystickSize) * 100}%`
            this.joystickKnob.style.top = `${50 + (finalY / this.joystickSize) * 100}%`
        }

        // Update input values (-1 to 1)
        this.joystickInput.x = finalX / this.maxDistance
        this.joystickInput.y = -finalY / this.maxDistance // Invert Y for game coordinates
    }

    private onPointerEnd(event: MouseEvent | TouchEvent): void {
        if (!this.isJoystickActive) return

        event.preventDefault()
        this.isJoystickActive = false
        this.joystickInput.isActive = false

        // Reset knob position
        this.resetKnobPosition()

        // Reset input values
        this.joystickInput.x = 0
        this.joystickInput.y = 0

        // Reset visual feedback
        if (this.joystickKnob) {
            this.joystickKnob.style.transform = 'translate(-50%, -50%) scale(1)'
        }
        if (this.joystickBase) {
            this.joystickBase.style.borderColor = 'rgba(255,255,255,0.3)'
            this.joystickBase.style.background =
                'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
        }
    }

    private resetKnobPosition(): void {
        if (!this.joystickKnob) return
        this.joystickKnob.style.left = '50%'
        this.joystickKnob.style.top = '50%'
    }

    update(_deltaTime: number): void {
        // This system just manages the UI, input is accessed via getJoystickInput()
    }

    getJoystickInput(): JoystickInput {
        return { ...this.joystickInput }
    }

    cleanup(): void {
        this.joystickContainer?.parentNode?.removeChild(this.joystickContainer)
        this.isUICreated = false
    }
}
