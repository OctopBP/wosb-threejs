import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
    return {
        // Set base path for GitHub Pages deployment
        base: mode === 'production' ? '/wosb-babylon/' : '/',
        resolve: {
            alias: {
                babylonjs:
                    mode === 'development'
                        ? 'babylonjs/babylon.max'
                        : 'babylonjs',
            },
        },
    }
})
