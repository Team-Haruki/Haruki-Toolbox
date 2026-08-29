import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'

const manualChunkGroups = [
    {
        // '@vue' must be listed: the scoped runtime packages (@vue/runtime-dom
        // etc.) otherwise fall through and get fused into whichever vendor
        // chunk the bundler picks (historically vendor-chart, putting unovis on
        // every page's critical path).
        name: 'vendor-vue',
        packages: ['vue', '@vue', 'vue-router', 'pinia'],
    },
    {
        name: 'vendor-ui',
        packages: ['reka-ui', 'lucide-vue-next'],
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

const adminPrecacheGlobIgnores = [
    '**/assets/{admin,AdminLayout,Dashboard,SystemLogs,UploadLogs,UserManagement,UserDetail,OAuthClientManagement,AdminWebhookManagement,ContentManagement,AdminSponsorManagement,SystemConfig,GameAccountBindings,RiskManagement,AdminTicketList,AdminTicketDetail}-*.js',
]

// Niche heavyweights (deck-recommend/score wasm, 3D costume engine, the
// non-default locale) are cached at runtime on first use instead of being
// force-downloaded to every visitor during SW install (~6MB of the old
// ~11MB precache).
const heavyAssetPrecacheGlobIgnores = [
    '**/*.wasm',
    '**/assets/haruki-3d-engine-*.js',
    '**/assets/en-US-*.js',
    '**/assets/zh-TW-*.js',
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
            execFileSync('/usr/bin/git', ['rev-parse', '--short=12', 'HEAD'], {
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

const localDevHost = 'haruki-dev-local.seiunx.com'
const localDevCert = new URL('./certs/haruki-dev-local.seiunx.com.pem', import.meta.url)
const localDevKey = new URL('./certs/haruki-dev-local.seiunx.com-key.pem', import.meta.url)

function resolveLocalDevServer(command: string, mode: string) {
    // Playwright must behave the same in local checkouts and CI, where the
    // gitignored development certificates are unavailable.
    if (command !== 'serve' || mode === 'e2e' || !existsSync(localDevCert) || !existsSync(localDevKey)) {
        return undefined
    }

    return {
        host: '127.0.0.1',
        allowedHosts: [localDevHost],
        port: 5173,
        strictPort: true,
        https: {
            cert: readFileSync(localDevCert),
            key: readFileSync(localDevKey),
        },
    }
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

function normalizeProxyTarget(value: string | undefined) {
    return value?.trim().replace(/\/+$/, '') ?? ''
}

function buildTrackerProxy(target: string) {
    return {
        '/event-tracker': {
            target,
            changeOrigin: true,
            ws: true,
            rewrite: (proxyPath: string) => proxyPath.replace(/^\/event-tracker/, ''),
        },
    }
}

function buildDevServerConfig(command: string, mode: string, trackerProxy: ReturnType<typeof buildTrackerProxy> | undefined) {
    const localDevServer = resolveLocalDevServer(command, mode)

    if (!localDevServer && !trackerProxy) {
        return undefined
    }

    return {
        ...localDevServer,
        ...(trackerProxy ? { proxy: trackerProxy } : {}),
    }
}

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const trackerProxyTarget = normalizeProxyTarget(env.HARUKI_EVENT_TRACKER_PROXY_TARGET)
    const trackerProxy = trackerProxyTarget ? buildTrackerProxy(trackerProxyTarget) : undefined

    return {
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
                    globIgnores: [...adminPrecacheGlobIgnores, ...heavyAssetPrecacheGlobIgnores],
                    maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
                    navigateFallbackDenylist: [/^\/api\//],
                    // Sekai game-asset and toolbox static images (music jackets, card
                    // art, icons) are content-addressed and immutable. Cache them at
                    // runtime so re-opening pickers or revisiting pages reuses them
                    // instead of re-downloading — independent of the CDN's headers.
                    // Scoped to image extensions to avoid caching large 3D bundles.
                    runtimeCaching: [
                        {
                            // Hashed heavyweights excluded from the precache above:
                            // immutable by filename, so cache-first on first use.
                            urlPattern: /\/assets\/(?:[^/]+\.wasm|haruki-3d-engine-[^/]+\.js|en-US-[^/]+\.js|zh-TW-[^/]+\.js)$/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'heavy-immutable-assets',
                                expiration: {
                                    maxEntries: 24,
                                    maxAgeSeconds: 60 * 60 * 24 * 60,
                                    purgeOnQuotaError: true,
                                },
                                cacheableResponse: {
                                    statuses: [0, 200],
                                },
                            },
                        },
                        {
                            // Keep latency probes on the network. Caching them makes
                            // endpoint re-tests measure Service Worker cache reads.
                            urlPattern: /^https:\/\/(sekai-assets\.haruki\.seiunx\.com|sekai-assets-bdf29c81\.seiunx\.net|toolbox-sekai-assets\.haruki\.seiunx\.com|images\.haruki\.seiunx\.com)\/(?!asset-probe\.png(?:\?|$)).*\.(?:png|jpe?g|webp|avif)(?:\?.*)?$/i,
                            // These <img> loads are cross-origin no-cors, so every
                            // response is opaque (status 0) — including CDN/WAF
                            // errors, which statuses:[0,200] cannot filter out. A
                            // cached error used to be pinned for 30 days (the
                            // Safari "banner never loads" bug). CacheFirst stays
                            // (revalidate-per-use would re-trigger the WAF's burst
                            // limit and can overwrite good entries with errors);
                            // instead image error handlers purge the poisoned
                            // entry and retry (shared/sekai/image-recovery.ts).
                            // The v2 name abandons caches poisoned before that
                            // recovery existed; pwa.ts deletes the old cache.
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'sekai-image-assets-v2',
                                expiration: {
                                    maxEntries: 4000,
                                    maxAgeSeconds: 60 * 60 * 24 * 30,
                                    purgeOnQuotaError: true,
                                },
                                cacheableResponse: {
                                    statuses: [0, 200],
                                },
                            },
                        },
                    ],
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
                '@': path.resolve(import.meta.dirname, './src'),
            },
        },
        server: buildDevServerConfig(command, mode, trackerProxy),
        preview: trackerProxy
            ? { proxy: trackerProxy }
            : undefined,
        build: {
            rolldownOptions: {
                checks: {
                    pluginTimings: false,
                },
                output: {
                    // Native rolldown chunking with explicit priority: earlier
                    // groups win, so the Vue runtime can never be captured by
                    // the chart chunk (which would drag unovis onto every
                    // page's critical path).
                    advancedChunks: {
                        groups: manualChunkGroups.map((group) => ({
                            name: group.name,
                            test: new RegExp(
                                `node_modules/(?:${group.packages
                                    .map((packageName) => packageName.replace(/[/@]/g, (ch) => `\\${ch}`))
                                    .join('|')})/`,
                            ),
                        })),
                    },
                },
            },
        },
    }
})
