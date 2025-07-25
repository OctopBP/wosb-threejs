import { AppOne as App } from './AppOne'
import { AudioPreloader } from './AudioPreloader'
import { preloadModels } from './ModelPreloader'

window.addEventListener('DOMContentLoaded', () => {
    const showLoading = () => {
        const overlay = document.getElementById('loadingOverlay')
        if (overlay) overlay.style.display = 'flex'
    }
    const hideLoading = () => {
        const overlay = document.getElementById('loadingOverlay')
        if (overlay) overlay.style.display = 'none'
    }

    const updateLoadingText = (text: string) => {
        const loadingText = document.querySelector('.loading-text')
        if (loadingText) loadingText.textContent = text
    }

    showLoading()
    updateLoadingText('Loading models...')

    // First preload models
    preloadModels()
        .then(() => {
            updateLoadingText('Loading audio assets...')
            // Then preload audio assets
            const audioPreloader = new AudioPreloader((progress) => {
                updateLoadingText(`Loading audio: ${progress.percentage}%`)
            })
            return audioPreloader.preloadAudioAssets()
        })
        .then((preloadedAudioBuffers) => {
            updateLoadingText('Starting game...')
            hideLoading()

            const canvas = document.getElementById(
                'renderCanvas',
            ) as HTMLCanvasElement
            const app = new App(canvas, preloadedAudioBuffers)
            app.run()
        })
        .catch((error) => {
            console.error('Failed to preload assets:', error)
            updateLoadingText('Error loading game assets')
            // Still try to start the game after a delay
            setTimeout(() => {
                hideLoading()
                const canvas = document.getElementById(
                    'renderCanvas',
                ) as HTMLCanvasElement
                const app = new App(canvas)
                app.run()
            }, 2000)
        })
})
