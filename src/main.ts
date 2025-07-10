import { AppOne as App } from './AppOne'

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement
    const app = new App(canvas)
    app.run()
})
