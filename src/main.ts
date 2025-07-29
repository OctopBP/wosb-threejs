import { AppOne as App } from './AppOne'
import { preloadModels } from './ModelPreloader'
import { PlaygamaSDK } from './PlaygamaSDK'

window.addEventListener('DOMContentLoaded', async () => {
    const showLoading = () => {
        const overlay = document.getElementById('loadingOverlay')
        if (overlay) overlay.style.display = 'flex'
    }
    const hideLoading = () => {
        const overlay = document.getElementById('loadingOverlay')
        if (overlay) overlay.style.display = 'none'
    }

    showLoading()

    // Initialize Playgama SDK
    const playgamaSDK = PlaygamaSDK.getInstance()

    // Notify SDK that game loading has started
    playgamaSDK.gameLoadingStart()

    try {
        await preloadModels()

        // Notify SDK that game loading has finished
        playgamaSDK.gameLoadingFinished()

        hideLoading()

        const canvas = document.getElementById(
            'renderCanvas',
        ) as HTMLCanvasElement
        const app = new App(canvas)

        // Initialize SDK with app-specific handlers
        await playgamaSDK.initialize({
            onReady: () => {
                console.log('Playgama SDK is ready')
            },
            onGameStart: () => {
                console.log('Game started through Playgama platform')
            },
            onGamePause: () => {
                console.log('Game paused by Playgama platform')
                app.pause()
            },
            onGameResume: () => {
                console.log('Game resumed by Playgama platform')
                app.resume()
            },
        })

        // Start the game
        app.run()

        // Notify SDK that gameplay has started
        playgamaSDK.gameplayStart()
    } catch (error) {
        console.error('Failed to initialize game:', error)
        hideLoading()
    }
})
