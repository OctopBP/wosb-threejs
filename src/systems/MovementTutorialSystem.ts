import { System } from '../ecs/System'

import type { World } from '../ecs/World'

const MOVE_INSTRUCTION = 'Перемещайтесь с помощью WASD или стрелок'

export class MovementTutorialSystem extends System {
    private tutorialContainer: HTMLElement | null = null
    private cursorHand: HTMLImageElement | null = null
    private isVisible = true
    private isUICreated = false
    private animationId: number | null = null
    private startTime = 0

    constructor(world: World) {
        super(world, [])
    }

    init(): void {
        this.createTutorial()
        this.setupInputListeners()
        this.startTime = performance.now()
    }

    update(_deltaTime: number): void {
        if (!this.isUICreated) {
            this.createTutorial()
        }

        if (this.isVisible && this.cursorHand) {
            this.animateCursorAlongInfinity()
        }
    }

    private createTutorial(): void {
        if (this.isUICreated) return

        // Create main tutorial container
        this.tutorialContainer = document.createElement('div')
        this.tutorialContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            justify-content: end;
            align-items: center;
            z-index: 10000;
            pointer-events: none;
            user-select: none;
        `

        // Create animation container
        const animationContainer = document.createElement('div')
        animationContainer.style.cssText = `
            position: relative;
            width: 200px;
            height: 120px;
            margin-bottom: 30px;
        `
        // Create infinity symbol background
        const infinityBg = document.createElement('img')
        infinityBg.src = 'assets/ui/infinity.png'
        infinityBg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            opacity: 0.8;
        `

        // Create cursor hand
        this.cursorHand = document.createElement('img') as HTMLImageElement
        this.cursorHand.src = 'assets/ui/cursor_hand.png'
        this.cursorHand.style.cssText = `
            position: absolute;
            width: 24px;
            height: 24px;
            object-fit: contain;
            transition: none;
        `

        // Create instruction text
        const instructionText = document.createElement('div')
        instructionText.textContent = MOVE_INSTRUCTION
        instructionText.style.cssText = `
            color: white;
            font-family: Arial, sans-serif;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            margin-bottom: 100px;
        `

        // Assemble the tutorial
        animationContainer.appendChild(infinityBg)
        animationContainer.appendChild(this.cursorHand)

        this.tutorialContainer.appendChild(animationContainer)
        this.tutorialContainer.appendChild(instructionText)

        document.body.appendChild(this.tutorialContainer)
        this.isUICreated = true
    }

    private animateCursorAlongInfinity(): void {
        if (!this.cursorHand) return

        const currentTime = performance.now()
        const elapsed = (currentTime - this.startTime) / 1000 // Convert to seconds
        const speed = 2.0 // Animation speed
        const t = (elapsed * speed) % (2 * Math.PI) // Parameter for infinity curve

        // Infinity curve parametric equations
        // x = a * cos(t) / (1 + sin²(t))
        // y = a * sin(t) * cos(t) / (1 + sin²(t))
        const a = 95 // Scale factor
        const sinT = Math.sin(t)
        const cosT = Math.cos(t)
        const denominator = 1 + sinT * sinT

        const x = (a * cosT) / denominator
        const y = (a * sinT * cosT) / denominator

        // Center the animation (100px is half of container width, 60px is half of container height)
        const centerX = 100
        const centerY = 60

        this.cursorHand.style.left = `${centerX + x}px`
        this.cursorHand.style.top = `${centerY + y}px`
    }

    private setupInputListeners(): void {
        // Listen for keyboard events
        const onKeyDown = (event: KeyboardEvent) => {
            const key = event.code.toLowerCase()
            if (
                key === 'keyw' ||
                key === 'keys' ||
                key === 'keya' ||
                key === 'keyd' ||
                key === 'arrowup' ||
                key === 'arrowdown' ||
                key === 'arrowleft' ||
                key === 'arrowright'
            ) {
                this.hideTutorial()
            }
        }

        // Listen for mouse/touch events
        const onInteraction = () => {
            this.hideTutorial()
        }

        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('mousedown', onInteraction)
        window.addEventListener('touchstart', onInteraction)

        // Store listeners for cleanup
        this.keyDownListener = onKeyDown
        this.interactionListener = onInteraction
    }

    private keyDownListener: ((event: KeyboardEvent) => void) | null = null
    private interactionListener: (() => void) | null = null

    private hideTutorial(): void {
        if (!this.isVisible) return

        this.isVisible = false

        if (this.tutorialContainer) {
            // Fade out animation
            this.tutorialContainer.style.transition = 'opacity 0.5s ease-out'
            this.tutorialContainer.style.opacity = '0'

            setTimeout(() => {
                if (this.tutorialContainer) {
                    document.body.removeChild(this.tutorialContainer)
                    this.tutorialContainer = null
                }
            }, 500)
        }

        // Clean up event listeners
        if (this.keyDownListener) {
            window.removeEventListener('keydown', this.keyDownListener)
        }
        if (this.interactionListener) {
            window.removeEventListener('mousedown', this.interactionListener)
            window.removeEventListener('touchstart', this.interactionListener)
        }

        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
        }
    }

    public forceHide(): void {
        this.hideTutorial()
    }

    destroy(): void {
        this.hideTutorial()
    }
}
