import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

const manualChunkGroups = [
    {
        name: 'vendor-vue',
        packages: ['vue', 'vue-router', 'pinia'],
    },
    {
        name: 'vendor-ui',
        packages: ['reka-ui', '@tanstack/vue-table', 'lucide-vue-next'],
    },
    {
        name: 'vendor-chart',
        packages: ['@unovis/ts', '@unovis/vue'],
    },
    {
        name: 'vendor-monaco',
        packages: ['@guolao/vue-monaco-editor'],
    },
]

export default defineConfig(({ command }) => ({
    envPrefix: ['VITE_', 'ENABLE_'],
    plugins: [vue(), tailwindcss(), command === 'serve' ? vueDevTools() : null].filter(Boolean),
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    const normalizedId = id.replaceAll('\\', '/')

                    return manualChunkGroups.find((group) =>
                        group.packages.some((packageName) =>
                            normalizedId.includes(`/node_modules/${packageName}/`),
                        ),
                    )?.name
                },
            },
        },
    },
}))
