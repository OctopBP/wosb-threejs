import type { AudioSystem } from './AudioSystem'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class AudioUISystem extends System {
    private audioSystem: AudioSystem | null = null
    private loadingUI: HTMLDivElement | null = null
    private progressBar: HTMLDivElement | null = null
    private progressText: HTMLDivElement | null = null
    private muteButton: HTMLElement | null = null
    private isUISetup = false

    constructor(world: World) {
        super(world, [])
    }

    setAudioSystem(audioSystem: AudioSystem): void {
        this.audioSystem = audioSystem
        this.setupLoadingUI()
        this.setupMuteButton()
    }

    private setupLoadingUI(): void {
        if (this.isUISetup || !this.audioSystem) return

        // Create loading UI
        this.loadingUI = document.createElement('div')
        this.loadingUI.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 1000;
            min-width: 200px;
            display: none;
        `

        // Create progress text
        this.progressText = document.createElement('div')
        this.progressText.style.cssText = `
            margin-bottom: 10px;
            text-align: center;
        `
        this.progressText.textContent = 'Loading audio...'

        // Create progress bar container
        const progressContainer = document.createElement('div')
        progressContainer.style.cssText = `
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            overflow: hidden;
        `

        // Create progress bar
        this.progressBar = document.createElement('div')
        this.progressBar.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #45a049);
            width: 0%;
            transition: width 0.3s ease;
        `

        progressContainer.appendChild(this.progressBar)
        this.loadingUI.appendChild(this.progressText)
        this.loadingUI.appendChild(progressContainer)
        document.body.appendChild(this.loadingUI)

        // Subscribe to loading progress
        this.audioSystem.onLoadingProgress((progress) => {
            this.updateLoadingUI(progress)
        })

        this.isUISetup = true
    }

    private setupMuteButton(): void {
        if (!this.audioSystem) return

        this.muteButton = document.createElement('button')
        this.muteButton.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 40px;
            height: 40px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            background: rgba(0, 0, 0, 0.5);
            cursor: pointer;
            z-index: 1001;
            transition: all 0.25s ease;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            background-size: 24px 24px;
            background-repeat: no-repeat;
            background-position: center;
        `

        this.muteButton.addEventListener('mouseenter', () => {
            if (this.muteButton) {
                this.muteButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                this.muteButton.style.transform = 'scale(1.05)'
                this.updateButtonIcon()
            }
        })

        this.muteButton.addEventListener('mouseleave', () => {
            if (this.muteButton) {
                this.muteButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
                this.muteButton.style.transform = 'scale(1)'
                this.updateButtonIcon()
            }
        })

        this.muteButton.addEventListener('click', () => {
            this.toggleMute()
        })

        document.body.appendChild(this.muteButton)
        this.updateButtonIcon()
    }

    private updateLoadingUI(progress: {
        total: number
        loaded: number
        failed: number
        percentage: number
        isComplete: boolean
    }): void {
        if (!this.loadingUI || !this.progressBar || !this.progressText) return

        // Show UI if loading has started
        if (progress.total > 0 && this.loadingUI.style.display === 'none') {
            this.loadingUI.style.display = 'block'
        }

        // Update progress bar
        this.progressBar.style.width = `${progress.percentage}%`

        // Update text
        if (progress.isComplete) {
            this.progressText.textContent = 'Audio ready!'
            // Hide UI after a short delay
            setTimeout(() => {
                if (this.loadingUI) {
                    this.loadingUI.style.display = 'none'
                }
            }, 2000)
        } else {
            this.progressText.textContent = `Loading audio: ${progress.loaded}/${progress.total} (${progress.percentage}%)`
        }

        // Show error count if any failed
        if (progress.failed > 0) {
            this.progressText.textContent += ` (${progress.failed} failed)`
        }
    }

    private updateButtonIcon(): void {
        if (!this.muteButton || !this.audioSystem) {
            return
        }

        const isMuted = this.audioSystem.isMuted()
        this.muteButton.title = isMuted ? 'Unmute' : 'Mute'
        
        // Use Unicode icons instead of image files
        this.muteButton.textContent = isMuted ? '🔇' : '🔊'
        this.muteButton.style.fontSize = '18px'
        this.muteButton.style.color = 'white'
    }

    private toggleMute(): void {
        if (!this.audioSystem) {
            return
        }

        const currentMuteState = this.audioSystem.isMuted()
        this.audioSystem.setMuted(!currentMuteState)
        this.updateButtonIcon()
    }

    update(_deltaTime: number): void {
        // Check if audio system is ready and hide loading UI if needed
        if (this.audioSystem && this.audioSystem.isReady() && this.loadingUI) {
            if (this.loadingUI.style.display !== 'none') {
                setTimeout(() => {
                    if (this.loadingUI) {
                        this.loadingUI.style.display = 'none'
                    }
                }, 1000)
            }
        }
    }

    destroy(): void {
        if (this.loadingUI && this.loadingUI.parentNode) {
            this.loadingUI.parentNode.removeChild(this.loadingUI)
        }
        if (this.muteButton && this.muteButton.parentNode) {
            this.muteButton.parentNode.removeChild(this.muteButton)
        }
        this.loadingUI = null
        this.progressBar = null
        this.progressText = null
        this.muteButton = null
        this.isUISetup = false
    }
}
