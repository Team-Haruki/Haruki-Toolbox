import { defineStore } from "pinia"
import { ref, computed } from "vue"

export type EndpointType = 'direct' | 'cdn'
export type ThemeType = 'light' | 'dark' | 'system'

export const useSettingsStore = defineStore("settings", () => {
    // Endpoint settings
    const directEndpoint = ref<string>(import.meta.env.VITE_HARUKI_TOOLBOX_DIRECT_URL || 'https://toolbox-api-direct.haruki.seiunx.com')
    const cdnEndpoint = ref<string>(import.meta.env.VITE_HARUKI_TOOLBOX_CDN_URL || 'https://toolbox-api-cdn.haruki.seiunx.com')
    const preferredEndpoint = ref<EndpointType>('direct')

    // Theme settings
    const theme = ref<ThemeType>('system')

    // iOS upload code
    const iosUploadCode = ref<string | null>(null)

    // Computed
    const currentEndpoint = computed(() => {
        return preferredEndpoint.value === 'cdn' ? cdnEndpoint.value : directEndpoint.value
    })


    function setPreferredEndpoint(type: EndpointType) {
        preferredEndpoint.value = type
    }

    function setTheme(newTheme: ThemeType) {
        theme.value = newTheme
        applyTheme(newTheme)
    }

    function setIOSUploadCode(code: string | null) {
        iosUploadCode.value = code
    }

    function applyTheme(themeValue: ThemeType) {
        const root = document.documentElement
        if (themeValue === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.classList.toggle('dark', prefersDark)
        } else {
            root.classList.toggle('dark', themeValue === 'dark')
        }
    }

    // Initialize theme on store creation
    function initTheme() {
        applyTheme(theme.value)
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (theme.value === 'system') {
                applyTheme('system')
            }
        })
    }

    return {
        directEndpoint,
        cdnEndpoint,
        preferredEndpoint,
        currentEndpoint,
        theme,
        iosUploadCode,
        setPreferredEndpoint,
        setTheme,
        setIOSUploadCode,
        initTheme,
    }
}, {
    persist: true
})
