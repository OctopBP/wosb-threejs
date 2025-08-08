import { AppOne as App } from './AppOne'
import { preloadLocalization, preloadModels } from './AssetsPreloader'
import { LocalizationManager } from './localization/LocalizationManager'

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

    // Initialize localization
    const localizationManager = LocalizationManager.getInstance()
    await localizationManager.initialize()

    showLoading()
    try {
        await preloadModels()
    } catch (e) {
        console.warn('preloadModels failed:', e)
    }
    // Skip audio preloading for faster startup; audio loads lazily on first use
    try {
        await preloadLocalization()
    } catch (e) {
        console.warn('preloadLocalization failed:', e)
    }
    hideLoading()

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement
    try {
        const app = new App(canvas)
        app.run()
    } catch (e) {
        console.error('App initialization failed:', e)
        // Show minimal fallback UI
        const overlay = document.getElementById('loadingOverlay')
        if (overlay) {
            overlay.textContent = 'Device not supported (WebGL).'
            overlay.setAttribute('style', overlay.getAttribute('style') || '')
        }
    }
})

function initializePlaygamaBridge(): Promise<void> {
    if (window.bridge && typeof window.bridge.initialize === 'function') {
        return window.bridge.initialize()
    }

    return Promise.resolve()
}
