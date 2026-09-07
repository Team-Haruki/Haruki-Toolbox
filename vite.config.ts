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

// The Service Worker no longer precaches the build, so nothing pulls the
// lazily-loaded route chunks until the user navigates to them. This manifest
// lets the running app warm them in the background, in parallel — including
// the chunks of a *newer* deployment, so the reload after an update prompt
// lands on an already-cached build.
function assetManifestPlugin(): Plugin {
    return {
        name: 'haruki-asset-manifest',
        generateBundle(_options, bundle) {
            const files = Object.entries(bundle)
                .filter(([fileName]) => /^assets\/.+\.(?:js|css)$/.test(fileName))
                // The 3D costume engine is a megabyte that most visitors never
                // open; it stays a pay-on-use download.
                .filter(([fileName]) => !fileName.includes('/haruki-3d-engine-'))
                .map(([fileName, output]) => ({
                    url: `${'/'}${fileName}`,
                    bytes: output.type === 'chunk'
                        ? Buffer.byteLength(output.code)
                        : Buffer.byteLength(
                            typeof output.source === 'string' ? output.source : Buffer.from(output.source),
                        ),
                }))
                .sort((left, right) => left.url.localeCompare(right.url))

            this.emitFile({
                type: 'asset',
                fileName: 'asset-manifest.json',
                source: `${JSON.stringify({ gitCommit: appBuildInfo.gitCommit, files }, null, 2)}\n`,
            })
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
    const normalized = value?.trim() ?? ''
    let end = normalized.length
    while (end > 0 && normalized[end - 1] === '/') {
        end -= 1
    }
    return normalized.slice(0, end)
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
            assetManifestPlugin(),
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
                    // Workbox installs precache entries strictly one at a time
                    // (upstream issue #2528), so every entry costs a full
                    // round-trip no matter how fast the connection is. Globbing
                    // the whole build produced ~395 entries / 5.4MB, and a real
                    // release renames ~170 of the content-hashed chunks — that
                    // serial queue is what made an update take about a minute.
                    // Precache only the navigation shell; everything under
                    // /assets/ is content-hashed and therefore immutable, so it
                    // is cached at runtime on first use, in parallel, by the
                    // browser's normal loading of the page.
                    // manifest.webmanifest is injected by vite-plugin-pwa itself.
                    globPatterns: ['index.html', '*.{ico,png,svg}'],
                    maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
                    navigateFallbackDenylist: [/^\/api\//],
                    runtimeCaching: [
                        {
                            // The whole build output is content-hashed, so a URL
                            // here never changes meaning: cache-first, never
                            // revalidated. This replaces the precache for every
                            // chunk, stylesheet, font and wasm blob.
                            urlPattern: ({ url, sameOrigin }: { url: URL, sameOrigin: boolean }) =>
                                sameOrigin && url.pathname.startsWith('/assets/'),
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'app-assets-v1',
                                expiration: {
                                    maxEntries: 600,
                                    maxAgeSeconds: 60 * 60 * 24 * 60,
                                    purgeOnQuotaError: true,
                                },
                                cacheableResponse: {
                                    statuses: [200],
                                },
                            },
                        },
                        {
                            // public/ assets keep stable URLs across builds, so
                            // they have to revalidate instead of pinning forever.
                            urlPattern: ({ url, sameOrigin }: { url: URL, sameOrigin: boolean }) =>
                                sameOrigin
                                && (url.pathname.startsWith('/rank-border/') || url.pathname.startsWith('/basis/')),
                            handler: 'StaleWhileRevalidate',
                            options: {
                                cacheName: 'app-static-v1',
                                expiration: {
                                    maxEntries: 300,
                                    maxAgeSeconds: 60 * 60 * 24 * 30,
                                    purgeOnQuotaError: true,
                                },
                                cacheableResponse: {
                                    statuses: [200],
                                },
                            },
                        },
                        {
                            // Sekai game-asset and toolbox static images (music
                            // jackets, card art, icons) are content-addressed and
                            // immutable. Cache them at runtime so re-opening pickers
                            // or revisiting pages reuses them instead of
                            // re-downloading — independent of the CDN's headers.
                            // Scoped to image extensions to avoid caching large 3D
                            // bundles.
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
