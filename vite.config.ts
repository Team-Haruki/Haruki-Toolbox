import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
    plugins: [vue(), tailwindcss(), vueDevTools()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})