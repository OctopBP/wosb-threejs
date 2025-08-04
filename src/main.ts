import { AppOne as App } from './AppOne'
import { preloadAudio, preloadModels } from './AssetsPreloader'

window.addEventListener('DOMContentLoaded', async () => {
    const showLoading = () => {
        const overlay = document.getElementById('loadingOverlay')
        if (overlay) overlay.style.display = 'flex'
    }

    const hideLoading = () => {
        const overlay = document.getElementById('loadingOverlay')
        if (overlay) overlay.style.display = 'none'
    }

    await initializePlaygamaBridge()

    showLoading()
    await preloadModels()
    await preloadAudio()
    hideLoading()

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement
    const app = new App(canvas)

    app.run()
})

function initializePlaygamaBridge(): Promise<void> {
    if (window.bridge && typeof window.bridge.initialize === 'function') {
        return window.bridge.initialize()
    }

    return Promise.resolve()
}
