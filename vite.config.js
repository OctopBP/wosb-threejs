import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production'
    const isAnalyze = mode === 'analyze'

    return {
        base: isProduction ? '/wosb-babylon/' : '/',
        resolve: {
            alias: {
                // No aliases needed with ES6 modules - they handle dev/prod automatically
            },
        },
        plugins: [
            // Add bundle analyzer for build analysis
            isAnalyze &&
                visualizer({
                    filename: 'dist/stats.html',
                    open: true,
                    gzipSize: true,
                    brotliSize: true,
                }),
        ].filter(Boolean),
        build: {
            // Optimize chunk splitting
            rollupOptions: {
                output: {
                    manualChunks: {
                        // Separate Babylon.js into its own chunk for better caching
                        babylon: ['@babylonjs/core', '@babylonjs/loaders'],
                        // Separate your game logic
                        game: [
                            './src/ecs/index.ts',
                            './src/systems/index.ts',
                            './src/entities/PlayerFactory.ts',
                            './src/GameWorld.ts',
                        ],
                    },
                    // Optimize chunk file names for better caching
                    chunkFileNames: isProduction
                        ? 'assets/[name]-[hash].js'
                        : '[name].js',
                    entryFileNames: isProduction
                        ? 'assets/[name]-[hash].js'
                        : '[name].js',
                    assetFileNames: isProduction
                        ? 'assets/[name]-[hash].[ext]'
                        : '[name].[ext]',
                },
                // Mark babylonjs as external for CDN loading (optional)
                external: isProduction ? [] : [],
            },
            // Optimize build size
            target: 'es2020',
            minify: isProduction ? 'terser' : false,
            terserOptions: isProduction
                ? {
                      compress: {
                          drop_console: true,
                          drop_debugger: true,
                          pure_funcs: [
                              'console.log',
                              'console.info',
                              'console.debug',
                          ],
                          // Remove unused code
                          dead_code: true,
                          // Remove unused imports
                          side_effects: false,
                      },
                      mangle: {
                          safari10: true,
                      },
                  }
                : undefined,
            // Warn about large chunks
            chunkSizeWarningLimit: 1500,
            // Don't include source maps in production
            sourcemap: !isProduction,
            // Enable code splitting
            cssCodeSplit: true,
        },
        // Optimize dependencies during development
        optimizeDeps: {
            include: ['@babylonjs/core', '@babylonjs/loaders'],
            esbuildOptions: {
                target: 'es2020',
            },
        },
        // Enable compression
        preview: {
            headers: {
                'Cache-Control': 'public, max-age=31536000',
            },
        },
    }
})
