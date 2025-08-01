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

        const imagesContainer = document.createElement('div')
        imagesContainer.style.cssText = `
            position: relative;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100px;
            gap: 50px;
            margin-bottom: 30px;
            padding: 0 20px;
            box-sizing: border-box;
        `

        // Create animation container
        const animationContainer = document.createElement('div')
        animationContainer.style.cssText = `
            position: relative;
            width: 200px;
            height: 120px;
            min-width: 150px;
            flex-shrink: 0;
        `

        // Create infinity symbol background
        const infinityBg = document.createElement('img')
        infinityBg.src = 'assets/ui/infinity.png'
        infinityBg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: auto;
            height: 100%;
            object-fit: contain;
        `

        // Create cursor hand
        this.cursorHand = document.createElement('img') as HTMLImageElement
        this.cursorHand.src = 'assets/ui/cursor.png'
        this.cursorHand.style.cssText = `
            position: absolute;
            width: 32px;
            height: 32px;
            object-fit: contain;
            transition: none;
        `

        const wasdBg = document.createElement('img')
        wasdBg.src = 'assets/ui/wasd.png'
        wasdBg.style.cssText = `
            height: 100%;
            width: auto;
            object-fit: contain;
            min-width: 120px;
            flex-shrink: 0;
        `

        // Hide wasdBg on narrow screens
        const mediaQuery = window.matchMedia('(max-width: 767px)')
        const updateWasdVisibility = (
            e: MediaQueryListEvent | MediaQueryList,
        ) => {
            wasdBg.style.display = e.matches ? 'none' : 'block'
        }

        // Set initial visibility
        updateWasdVisibility(mediaQuery)

        // Listen for screen size changes
        mediaQuery.addEventListener('change', updateWasdVisibility)

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

        imagesContainer.appendChild(animationContainer)
        imagesContainer.appendChild(wasdBg)

        this.tutorialContainer.appendChild(imagesContainer)
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
        const a = 90 // Scale factor
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
