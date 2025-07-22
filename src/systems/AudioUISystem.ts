import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { AudioSystem } from './AudioSystem'

export class AudioUISystem extends System {
    private audioSystem: AudioSystem | null = null
    private muteButton: HTMLElement | null = null
    private isUICreated = false

    constructor(world: World) {
        super(world, [])
    }

    setAudioSystem(audioSystem: AudioSystem): void {
        this.audioSystem = audioSystem
    }

    update(_deltaTime: number): void {
        if (!this.isUICreated) {
            this.createUI()
        }

        this.updateButtonState()
    }

    private createUI(): void {
        if (this.isUICreated || !this.audioSystem) return

        this.muteButton = document.createElement('button')
        this.muteButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 50px;
            height: 50px;
            border: none;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 1001;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        `

        this.muteButton.addEventListener('mouseenter', () => {
            if (this.muteButton) {
                this.muteButton.style.background = 'rgba(255, 255, 255, 0.1)'
                this.muteButton.style.transform = 'scale(1.05)'
            }
        })

        this.muteButton.addEventListener('mouseleave', () => {
            if (this.muteButton) {
                this.muteButton.style.background = 'rgba(0, 0, 0, 0.7)'
                this.muteButton.style.transform = 'scale(1)'
            }
        })

        this.muteButton.addEventListener('click', () => {
            this.toggleMute()
        })

        document.body.appendChild(this.muteButton)
        this.isUICreated = true
    }

    private updateButtonState(): void {
        if (!this.muteButton || !this.audioSystem) return

        const isMuted = this.audioSystem.isMuted()
        this.muteButton.textContent = isMuted ? '🔇' : '🔊'
        this.muteButton.title = isMuted ? 'Unmute' : 'Mute'
    }

    private toggleMute(): void {
        if (!this.audioSystem) return

        const currentMuteState = this.audioSystem.isMuted()
        this.audioSystem.setMuted(!currentMuteState)
    }

    destroy(): void {
        if (this.muteButton) {
            document.body.removeChild(this.muteButton)
            this.muteButton = null
        }
        this.isUICreated = false
    }
}
