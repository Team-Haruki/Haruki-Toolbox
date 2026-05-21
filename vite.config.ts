import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
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

const packageJson = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version?: string }

function shortenGitHash(hash: string) {
    return hash.trim().slice(0, 12)
}

function resolveGitHash() {
    const ciGitHash = [
        process.env.VITE_HARUKI_TOOLBOX_GIT_HASH,
        process.env.GITHUB_SHA,
        process.env.CF_PAGES_COMMIT_SHA,
        process.env.VERCEL_GIT_COMMIT_SHA,
    ].find((hash): hash is string => !!hash)

    if (ciGitHash) {
        return shortenGitHash(ciGitHash)
    }

    try {
        return shortenGitHash(
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
    gitHash: resolveGitHash(),
    buildTime: new Date().toISOString(),
}

export default defineConfig(({ command }) => ({
    envPrefix: ['VITE_', 'ENABLE_'],
    plugins: [vue(), tailwindcss(), command === 'serve' ? vueDevTools() : null].filter(Boolean),
    define: {
        __APP_VERSION__: JSON.stringify(appBuildInfo.version),
        __APP_GIT_HASH__: JSON.stringify(appBuildInfo.gitHash),
        __APP_BUILD_TIME__: JSON.stringify(appBuildInfo.buildTime),
    },
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
