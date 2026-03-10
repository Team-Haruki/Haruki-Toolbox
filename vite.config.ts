import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ command }) => ({
    plugins: [vue(), tailwindcss(), command === 'serve' ? vueDevTools() : null].filter(Boolean),
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    "vendor-vue": ["vue", "vue-router", "pinia"],
                    "vendor-ui": ["reka-ui", "@tanstack/vue-table", "lucide-vue-next"],
                    "vendor-chart": ["@unovis/ts", "@unovis/vue"],
                    "vendor-monaco": ["@guolao/vue-monaco-editor"],
                },
            },
        },
    },
}))
