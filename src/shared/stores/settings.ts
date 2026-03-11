import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { DEFAULT_LOCALE, type AppLocale } from "@/shared/i18n"

export type EndpointType = 'direct' | 'cdn'
export type ThemeType = 'light' | 'dark' | 'system'

const SYSTEM_THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

function normalizeEndpointUrl(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim().replace(/\/+$/, '')
}

export const useSettingsStore = defineStore("settings", () => {
    const directEndpoint = computed(() => normalizeEndpointUrl(import.meta.env.VITE_HARUKI_TOOLBOX_DIRECT_URL))
    const cdnEndpoint = computed(() => normalizeEndpointUrl(import.meta.env.VITE_HARUKI_TOOLBOX_CDN_URL))
    const preferredEndpoint = ref<EndpointType>('direct')
    const theme = ref<ThemeType>('system')
    const locale = ref<AppLocale>(DEFAULT_LOCALE)
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

    function setPreferredEndpoint(type: EndpointType) {
        preferredEndpoint.value = resolveAvailableEndpoint(type)
    }
    function setTheme(newTheme: ThemeType) {
        theme.value = newTheme
        applyTheme(newTheme)
    }
    function setLocale(newLocale: AppLocale) {
        locale.value = newLocale
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
    return {
        directEndpoint,
        cdnEndpoint,
        hasDirectEndpoint,
        hasCdnEndpoint,
        preferredEndpoint,
        resolvedPreferredEndpoint,
        currentEndpoint,
        theme,
        locale,
        getEndpointUrl,
        setPreferredEndpoint,
        setTheme,
        setLocale,
        initTheme,
    }
}, {
    persist: {
        pick: ['preferredEndpoint', 'theme', 'locale']
    }
})
