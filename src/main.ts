import { AppOne as App } from './AppOne'
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
    showLoading()
    preloadModels().then(() => {
        hideLoading()
        const canvas = document.getElementById(
            'renderCanvas',
        ) as HTMLCanvasElement
        const app = new App(canvas)
        app.run()
    })
})
