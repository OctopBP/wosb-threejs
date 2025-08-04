import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production'
    const isAnalyze = mode === 'analyze'

    return {
        base: isProduction ? '/wosb-threejs/' : '/',

        build: {
            outDir: 'dist',
            assetsDir: 'assets',
            sourcemap: !isProduction,
            minify: isProduction ? 'terser' : false,

            rollupOptions: {
                input: {
                    main: './index.html',
                },
                output: {
                    manualChunks: {
                        // Separate Three.js into its own chunk for better caching
                        three: ['three'],
                        vendor: ['lil-gui'],
                    },
                },
            },

            terserOptions: {
                compress: {
                    drop_console: isProduction,
                    drop_debugger: isProduction,
                },
            },
        },

        server: {
            port: 3001,
            host: '0.0.0.0',
            strictPort: false,
        },

        optimizeDeps: {
            // Mark three.js as external for CDN loading (optional)
            // force: true,
            include: ['three', 'lil-gui'],
        },

        plugins: [
            // Copy playgama bridge files to build output
            {
                name: 'copy-playgama-files',
                generateBundle() {
                    const bridgeJsPath = resolve(__dirname, 'playgama-bridge.js')
                    const bridgeConfigPath = resolve(__dirname, 'playgama-bridge-config.json')

                    if (existsSync(bridgeJsPath)) {
                        this.emitFile({
                            type: 'asset',
                            fileName: 'playgama-bridge.js',
                            source: readFileSync(bridgeJsPath, 'utf-8')
                        })
                    }

                    if (existsSync(bridgeConfigPath)) {
                        this.emitFile({
                            type: 'asset',
                            fileName: 'playgama-bridge-config.json',
                            source: readFileSync(bridgeConfigPath, 'utf-8')
                        })
                    }
                }
            },
            isAnalyze &&
                visualizer({
                    filename: 'dist/stats.html',
                    open: true,
                    gzipSize: true,
                    brotliSize: true,
                }),
        ].filter(Boolean),

        css: {
            devSourcemap: true,
        },

        define: {
            // Define global constants for production optimization
            __DEV__: !isProduction,
        },
    }
})
