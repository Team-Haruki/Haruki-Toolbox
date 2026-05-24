import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
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

const packageJson = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version?: string }

function shortenGitCommit(hash: string) {
    return hash.trim().slice(0, 12)
}

function resolveGitCommit() {
    const ciGitCommit = [
        process.env.VITE_HARUKI_TOOLBOX_GIT_COMMIT,
        process.env.VITE_HARUKI_TOOLBOX_GIT_HASH,
        process.env.GITHUB_SHA,
        process.env.CF_PAGES_COMMIT_SHA,
        process.env.VERCEL_GIT_COMMIT_SHA,
    ].find((hash): hash is string => !!hash)

    if (ciGitCommit) {
        return shortenGitCommit(ciGitCommit)
    }

    try {
        return shortenGitCommit(
            execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            }),
        )
    } catch {
        return 'unknown'
    }
}

const appBuildInfo = {
    version: packageJson.version ?? '0.0.0',
    gitCommit: resolveGitCommit(),
    buildTime: new Date().toISOString(),
}

function buildInfoPlugin(): Plugin {
    return {
        name: 'haruki-build-info',
        generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: 'build-info.json',
                source: `${JSON.stringify(appBuildInfo, null, 2)}\n`,
            })
        },
    }
}

export default defineConfig(({ command }) => ({
    envPrefix: ['VITE_', 'ENABLE_'],
    plugins: [
        vue(),
        tailwindcss(),
        buildInfoPlugin(),
        VitePWA({
            registerType: 'prompt',
            includeManifestIcons: false,
            manifest: {
                name: 'Haruki Toolbox',
                short_name: 'Haruki',
                description: 'Project Haruki web toolbox for Project Sekai utilities.',
                lang: 'zh-CN',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                background_color: '#f8fafc',
                theme_color: '#0f172a',
                categories: ['utilities', 'games'],
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },
            workbox: {
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,wasm}'],
                maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
                navigateFallbackDenylist: [/^\/api\//],
            },
            devOptions: {
                enabled: false,
            },
        }),
        command === 'serve' ? vueDevTools() : null,
    ].filter(Boolean),
    define: {
        __APP_VERSION__: JSON.stringify(appBuildInfo.version),
        __APP_GIT_COMMIT__: JSON.stringify(appBuildInfo.gitCommit),
        __APP_BUILD_TIME__: JSON.stringify(appBuildInfo.buildTime),
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rolldownOptions: {
            checks: {
                pluginTimings: false,
            },
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
