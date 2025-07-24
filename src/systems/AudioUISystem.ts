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

    destroy(): void {
        if (this.muteButton) {
            document.body.removeChild(this.muteButton)
            this.muteButton = null
        }
        this.isUICreated = false
    }
}
