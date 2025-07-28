import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { AudioSystem } from './AudioSystem'

export class AudioUISystem extends System {
    private audioSystem: AudioSystem | null = null
    private loadingElement: HTMLDivElement | null = null
    private progressBar: HTMLDivElement | null = null
    private statusText: HTMLDivElement | null = null
    private muteButton: HTMLElement | null = null
    private isUICreated = false

    constructor(world: World) {
        super(world, [])
    }

    setAudioSystem(audioSystem: AudioSystem): void {
        this.audioSystem = audioSystem

        // Subscribe to loading progress updates
        audioSystem.onLoadingProgress((progress) => {
            this.updateLoadingUI(progress)
        })
    }

    update(_deltaTime: number): void {
        if (!this.isUICreated) {
            this.createMuteButton()
        }

        this.updateButtonState()

        // Check if audio system is ready and show/hide loading UI accordingly
        if (this.audioSystem) {
            const status = this.audioSystem.getStatus()

            if (!status.ready && status.totalAssets > 0) {
                // Show loading UI if not ready and there are assets to load
                if (!this.loadingElement) {
                    this.createLoadingUI()
                }
            } else if (status.ready && this.loadingElement) {
                // Hide loading UI if ready
                this.removeLoadingUI()
            }
        }
    }

    private createMuteButton(): void {
        if (this.isUICreated || !this.audioSystem) return

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
                this.muteButton.style.backgroundColor =
                    'rgba(255, 255, 255, 0.3)'
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
        this.isUICreated = true
    }

    private updateButtonState(): void {
        if (!this.muteButton || !this.audioSystem) {
            return
        }

        const isMuted = this.audioSystem.isMuted()
        this.muteButton.title = isMuted ? 'Unmute' : 'Mute'
        this.updateButtonIcon()
    }

    private updateButtonIcon(): void {
        if (!this.muteButton || !this.audioSystem) {
            return
        }

        const isMuted = this.audioSystem.isMuted()
        const iconPath = isMuted
            ? 'assets/ui/nosound.png'
            : 'assets/ui/sound.png'

        this.muteButton.style.backgroundImage = `url('${iconPath}')`
    }

    private toggleMute(): void {
        if (!this.audioSystem) {
            return
        }

        const currentMuteState = this.audioSystem.isMuted()
        this.audioSystem.setMuted(!currentMuteState)
    }

    private createLoadingUI(): void {
        // Remove existing loading UI if it exists
        this.removeLoadingUI()

        // Create loading container
        this.loadingElement = document.createElement('div')
        this.loadingElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            font-family: Arial, sans-serif;
            z-index: 1000;
            min-width: 300px;
        `

        // Create title
        const title = document.createElement('h3')
        title.textContent = '🎵 Loading Audio Assets'
        title.style.margin = '0 0 15px 0'
        this.loadingElement.appendChild(title)

        // Create progress bar container
        const progressContainer = document.createElement('div')
        progressContainer.style.cssText = `
            width: 100%;
            height: 20px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 10px;
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

        // Create status text
        this.statusText = document.createElement('div')
        this.statusText.style.cssText = `
            font-size: 14px;
            opacity: 0.8;
        `
        this.statusText.textContent = 'Initializing...'

        this.loadingElement.appendChild(progressContainer)
        this.loadingElement.appendChild(this.statusText)

        document.body.appendChild(this.loadingElement)
    }

    private updateLoadingUI(progress: {
        totalAssets: number
        loadedAssets: number
        loadingProgress: number
        isComplete: boolean
        errors: string[]
    }): void {
        if (!this.loadingElement || !this.progressBar || !this.statusText) {
            this.createLoadingUI()
        }

        if (this.progressBar) {
            this.progressBar.style.width = `${progress.loadingProgress * 100}%`
        }

        if (this.statusText) {
            if (progress.isComplete) {
                this.statusText.textContent = `✅ Audio ready! (${progress.loadedAssets}/${progress.totalAssets} assets loaded)`
                // Hide loading UI after a short delay
                setTimeout(() => {
                    this.removeLoadingUI()
                }, 1500)
            } else if (progress.errors.length > 0) {
                this.statusText.textContent = `⚠️ Loading with errors: ${progress.loadedAssets}/${progress.totalAssets} assets loaded`
            } else {
                this.statusText.textContent = `Loading audio assets... ${progress.loadedAssets}/${progress.totalAssets}`
            }
        }
    }

    private removeLoadingUI(): void {
        if (this.loadingElement && this.loadingElement.parentNode) {
            this.loadingElement.parentNode.removeChild(this.loadingElement)
        }
        this.loadingElement = null
        this.progressBar = null
        this.statusText = null
    }

    destroy(): void {
        this.removeLoadingUI()
        if (this.muteButton) {
            document.body.removeChild(this.muteButton)
            this.muteButton = null
        }
        this.isUICreated = false
    }
}
