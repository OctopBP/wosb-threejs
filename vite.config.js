import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
    return {
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
