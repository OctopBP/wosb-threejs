import { AppOne as App } from './AppOne'

window.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement
    const app = new App(canvas)
    await app.run()
})
