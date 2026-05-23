import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { DEFAULT_LOCALE, type AppLocale } from "@/shared/i18n"
import { SEKAI_ASSET_ENDPOINT_ROOTS } from "@/shared/sekai/data-sources"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"

export type EndpointType = 'direct' | 'cdn'
export type ThemeType = 'light' | 'dark' | 'system'
export type EndpointLatencyStatus = 'pending' | 'ok' | 'failed'
export type EndpointLatencyResult = {
    status: EndpointLatencyStatus
    elapsedMs: number | null
    checkedAt: number | null
}
export type AssetEndpointLatencyStatus = EndpointLatencyStatus
export type AssetEndpointLatencyResult = EndpointLatencyResult

const SYSTEM_THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'
const ENDPOINT_TIMEOUT_MS = 5000
const SERVER_ENDPOINT_HEALTH_PATH = '/api/health'
const ENDPOINT_TYPES: EndpointType[] = ['direct', 'cdn']
const ASSET_ENDPOINT_TIMEOUT_MS = 5000
const ASSET_ENDPOINT_PROBE_PATH = '/asset-probe.png'
const ASSET_ENDPOINT_TYPES: SekaiAssetEndpointPreference[] = ['china', 'global']

function normalizeEndpointUrl(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim().replace(/\/+$/, '')
}

function createEmptyAssetEndpointLatencyResults(): Record<SekaiAssetEndpointPreference, AssetEndpointLatencyResult> {
    return {
        china: { status: 'pending', elapsedMs: null, checkedAt: null },
        global: { status: 'pending', elapsedMs: null, checkedAt: null },
    }
}

function createEmptyEndpointLatencyResults(): Record<EndpointType, EndpointLatencyResult> {
    return {
        direct: { status: 'pending', elapsedMs: null, checkedAt: null },
        cdn: { status: 'pending', elapsedMs: null, checkedAt: null },
    }
}

function normalizeAssetEndpointPreference(value: unknown): SekaiAssetEndpointPreference {
    return value === 'global' ? 'global' : 'china'
}

export const useSettingsStore = defineStore("settings", () => {
    const directEndpoint = computed(() => normalizeEndpointUrl(import.meta.env.VITE_HARUKI_TOOLBOX_DIRECT_URL))
    const cdnEndpoint = computed(() => normalizeEndpointUrl(import.meta.env.VITE_HARUKI_TOOLBOX_CDN_URL))
    const preferredEndpoint = ref<EndpointType>('direct')
    const endpointLatencyMeasuredAt = ref<number | null>(null)
    const endpointLatencyChecking = ref(false)
    const endpointLatencyResults = ref<Record<EndpointType, EndpointLatencyResult>>(createEmptyEndpointLatencyResults())
    const preferredAssetEndpoint = ref<SekaiAssetEndpointPreference>('china')
    const assetEndpointManuallySelected = ref(false)
    const assetEndpointLatencyMeasuredAt = ref<number | null>(null)
    const assetEndpointLatencyChecking = ref(false)
    const assetEndpointLatencyResults = ref<Record<SekaiAssetEndpointPreference, AssetEndpointLatencyResult>>(
        createEmptyAssetEndpointLatencyResults(),
    )
    const theme = ref<ThemeType>('system')
    const locale = ref<AppLocale>(DEFAULT_LOCALE)
    const reducedVisualEffects = ref(false)
    const hideGameUserId = ref(false)
    const hasDirectEndpoint = computed(() => directEndpoint.value !== '')
    const hasCdnEndpoint = computed(() => cdnEndpoint.value !== '')

    function resolveAvailableEndpoint(type: EndpointType): EndpointType {
        if (type === 'cdn' && hasCdnEndpoint.value) {
            return 'cdn'
        }

        if (hasDirectEndpoint.value) {
            return 'direct'
        }

        if (hasCdnEndpoint.value) {
            return 'cdn'
        }

        return type
    }

    function getEndpointUrl(type: EndpointType): string {
        if (type === 'cdn') {
            return cdnEndpoint.value
        }
        return directEndpoint.value
    }

    const resolvedPreferredEndpoint = computed(() => resolveAvailableEndpoint(preferredEndpoint.value))
    const currentEndpoint = computed(() => {
        return getEndpointUrl(resolvedPreferredEndpoint.value)
    })
    const currentAssetEndpoint = computed(() => normalizeAssetEndpointPreference(preferredAssetEndpoint.value))

    function setPreferredEndpoint(type: EndpointType) {
        preferredEndpoint.value = resolveAvailableEndpoint(type)
    }
    function setPreferredAssetEndpoint(type: SekaiAssetEndpointPreference, manual = true) {
        preferredAssetEndpoint.value = normalizeAssetEndpointPreference(type)
        if (manual) {
            assetEndpointManuallySelected.value = true
        }
    }
    function getAssetEndpointUrl(type: SekaiAssetEndpointPreference): string {
        return SEKAI_ASSET_ENDPOINT_ROOTS[type]
    }
    function resetAssetEndpointPreference() {
        preferredAssetEndpoint.value = 'china'
        assetEndpointManuallySelected.value = false
        assetEndpointLatencyMeasuredAt.value = null
        assetEndpointLatencyResults.value = createEmptyAssetEndpointLatencyResults()
    }
    function setTheme(newTheme: ThemeType) {
        theme.value = newTheme
        applyTheme(newTheme)
    }
    function setLocale(newLocale: AppLocale) {
        locale.value = newLocale
    }
    function setReducedVisualEffects(enabled: boolean) {
        reducedVisualEffects.value = enabled
        applyReducedVisualEffects(enabled)
    }
    function setHideGameUserId(enabled: boolean) {
        hideGameUserId.value = enabled
    }
    function applyTheme(themeValue: ThemeType) {
        const root = document.documentElement
        if (themeValue === 'system') {
            const prefersDark = window.matchMedia(SYSTEM_THEME_MEDIA_QUERY).matches
            root.classList.toggle('dark', prefersDark)
        } else {
            root.classList.toggle('dark', themeValue === 'dark')
        }
    }
    function applyReducedVisualEffects(enabled: boolean) {
        document.documentElement.classList.toggle('reduced-visual-effects', enabled)
    }
    let themeListenerInitialized = false
    let themeMediaQuery: MediaQueryList | null = null
    const handleThemeChange = () => {
        if (theme.value === 'system') {
            applyTheme('system')
        }
    }
    function initTheme() {
        applyTheme(theme.value)
        if (!themeListenerInitialized) {
            themeListenerInitialized = true
            themeMediaQuery = window.matchMedia(SYSTEM_THEME_MEDIA_QUERY)
            themeMediaQuery.removeEventListener('change', handleThemeChange)
            themeMediaQuery.addEventListener('change', handleThemeChange)
        }
    }
    function initVisualEffects() {
        applyReducedVisualEffects(reducedVisualEffects.value)
    }
    async function initAssetEndpointPreference() {
        const normalizedAssetEndpoint = normalizeAssetEndpointPreference(preferredAssetEndpoint.value)
        if (preferredAssetEndpoint.value !== normalizedAssetEndpoint) {
            preferredAssetEndpoint.value = normalizedAssetEndpoint
            assetEndpointManuallySelected.value = false
            assetEndpointLatencyMeasuredAt.value = null
        }

        if (assetEndpointLatencyMeasuredAt.value != null && hasAllAssetEndpointLatencyResults()) {
            return
        }

        await measureAssetEndpointLatencies(true)
    }
    async function measureEndpointLatencies() {
        if (endpointLatencyChecking.value) {
            return
        }

        endpointLatencyChecking.value = true
        endpointLatencyResults.value = createEmptyEndpointLatencyResults()
        try {
            const results = await Promise.all(ENDPOINT_TYPES.map(async (type) => {
                const url = getEndpointUrl(type)
                return {
                    type,
                    result: url
                        ? await measureEndpointLatency(url)
                        : { status: 'failed' as const, elapsedMs: null, checkedAt: Date.now() },
                }
            }))
            endpointLatencyResults.value = results.reduce((acc, item) => {
                acc[item.type] = item.result
                return acc
            }, createEmptyEndpointLatencyResults())
            endpointLatencyMeasuredAt.value = Date.now()
        } finally {
            endpointLatencyChecking.value = false
        }
    }
    async function measureAssetEndpointLatencies(applyFastest = false) {
        if (assetEndpointLatencyChecking.value) {
            return
        }

        assetEndpointLatencyChecking.value = true
        assetEndpointLatencyResults.value = createEmptyAssetEndpointLatencyResults()
        try {
            const results = await Promise.all(ASSET_ENDPOINT_TYPES.map(async (type) => ({
                type,
                result: await measureAssetEndpointLatency(SEKAI_ASSET_ENDPOINT_ROOTS[type]),
            })))
            assetEndpointLatencyResults.value = results.reduce((acc, item) => {
                acc[item.type] = item.result
                return acc
            }, createEmptyAssetEndpointLatencyResults())
            assetEndpointLatencyMeasuredAt.value = Date.now()
            if (applyFastest && !assetEndpointManuallySelected.value) {
                const fastest = results
                    .filter((item) => item.result.status === 'ok' && item.result.elapsedMs != null)
                    .sort((left, right) => (left.result.elapsedMs ?? Infinity) - (right.result.elapsedMs ?? Infinity))[0]
                if (fastest) {
                    setPreferredAssetEndpoint(fastest.type, false)
                }
            }
        } finally {
            assetEndpointLatencyChecking.value = false
        }
    }
    function hasAllAssetEndpointLatencyResults() {
        return ASSET_ENDPOINT_TYPES.every((type) => assetEndpointLatencyResults.value[type]?.checkedAt != null)
    }
    return {
        directEndpoint,
        cdnEndpoint,
        hasDirectEndpoint,
        hasCdnEndpoint,
        preferredEndpoint,
        resolvedPreferredEndpoint,
        currentEndpoint,
        endpointLatencyMeasuredAt,
        endpointLatencyChecking,
        endpointLatencyResults,
        preferredAssetEndpoint,
        currentAssetEndpoint,
        assetEndpointManuallySelected,
        assetEndpointLatencyMeasuredAt,
        assetEndpointLatencyChecking,
        assetEndpointLatencyResults,
        theme,
        locale,
        reducedVisualEffects,
        hideGameUserId,
        getEndpointUrl,
        getAssetEndpointUrl,
        setPreferredEndpoint,
        setPreferredAssetEndpoint,
        resetAssetEndpointPreference,
        setTheme,
        setLocale,
        setReducedVisualEffects,
        setHideGameUserId,
        initTheme,
        initVisualEffects,
        initAssetEndpointPreference,
        measureEndpointLatencies,
        measureAssetEndpointLatencies,
    }
}, {
    persist: {
        pick: [
            'preferredEndpoint',
            'endpointLatencyMeasuredAt',
            'endpointLatencyResults',
            'preferredAssetEndpoint',
            'assetEndpointManuallySelected',
            'assetEndpointLatencyMeasuredAt',
            'assetEndpointLatencyResults',
            'theme',
            'locale',
            'reducedVisualEffects',
            'hideGameUserId',
        ]
    }
})

async function measureEndpointLatency(rootUrl: string): Promise<EndpointLatencyResult> {
    const startedAt = performance.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), ENDPOINT_TIMEOUT_MS)
    try {
        const response = await fetch(`${rootUrl.replace(/\/+$/, '')}${SERVER_ENDPOINT_HEALTH_PATH}`, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-store',
            credentials: 'omit',
            signal: controller.signal,
        })
        if (response.type !== 'opaque' && !response.ok) {
            throw new Error(`Health check failed with HTTP ${response.status}`)
        }
        return {
            status: 'ok',
            elapsedMs: Math.max(1, Math.round(performance.now() - startedAt)),
            checkedAt: Date.now(),
        }
    } catch {
        return {
            status: 'failed',
            elapsedMs: null,
            checkedAt: Date.now(),
        }
    } finally {
        clearTimeout(timeout)
    }
}

async function measureAssetEndpointLatency(rootUrl: string): Promise<AssetEndpointLatencyResult> {
    const startedAt = performance.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), ASSET_ENDPOINT_TIMEOUT_MS)
    try {
        await fetch(`${rootUrl.replace(/\/+$/, '')}${ASSET_ENDPOINT_PROBE_PATH}`, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-store',
            credentials: 'omit',
            signal: controller.signal,
        })
        return {
            status: 'ok',
            elapsedMs: Math.max(1, Math.round(performance.now() - startedAt)),
            checkedAt: Date.now(),
        }
    } catch {
        return {
            status: 'failed',
            elapsedMs: null,
            checkedAt: Date.now(),
        }
    } finally {
        clearTimeout(timeout)
    }
}
