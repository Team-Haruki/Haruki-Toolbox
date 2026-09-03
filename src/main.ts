import './style.css'
import App from './App.vue'
import UnsupportedBrowserPage from "@/shared/components/UnsupportedBrowserPage.vue"
import router from "@/core/router"
import { createApp } from 'vue'
import { watch } from "vue"
import { createPinia } from 'pinia'
import { createPersistedState } from "pinia-plugin-persistedstate";
import { useUserStore } from "@/shared/stores/user";
import { useSettingsStore } from "@/shared/stores/settings";
import { setupInterceptors } from "@/core/http/call-api";
import { DEFAULT_LOCALE, i18n, isAppLocale, setI18nLocale } from "@/shared/i18n";
import { bootstrapUserSettingsFromKratosSession } from "@/modules/auth/lib/kratos";
import { registerAppServiceWorker } from "@/pwa";
import { isRestrictedBrowser } from "@/lib/restricted-browser";

/** Longest the splash waits for the session bootstrap before mounting anyway. */
const SESSION_BOOTSTRAP_WAIT_MS = 4000

if (isRestrictedBrowser()) {
    await setI18nLocale(DEFAULT_LOCALE)
    createApp(UnsupportedBrowserPage)
        .use(i18n)
        .mount('#app')
} else {
    const app = createApp(App)
    const pinia = createPinia()
    pinia.use(createPersistedState())
    app.use(pinia)
    const userStore = useUserStore()
    const settingsStore = useSettingsStore()
    settingsStore.initTheme()
    settingsStore.initVisualEffects()
    void settingsStore.initAssetEndpointPreference()
    // Locales are lazy chunks; the active one must be loaded before mount so
    // no raw translation keys ever flash on screen.
    await setI18nLocale(isAppLocale(settingsStore.locale) ? settingsStore.locale : DEFAULT_LOCALE)
    watch(
        () => settingsStore.locale,
        (locale) => {
            if (isAppLocale(locale)) {
                void setI18nLocale(locale)
            }
        },
        { immediate: false }
    )
    setupInterceptors(router)
    userStore.checkExpiration()
    const hadCachedUserContext = userStore.isLoggedIn || !!userStore.userId
    const sessionBootstrap = bootstrapUserSettingsFromKratosSession().then(
        ({ sessionUser, fullUser, hasKratosSession }) => {
            if (fullUser) {
                userStore.clearUser()
                userStore.setUser(fullUser)
                userStore.setSessionActive(true)
                userStore.setSettingsSyncState("synced")
            } else if (sessionUser) {
                // The `whoami` fallback is intentionally partial, so keep cached toolbox fields
                // until the post-login settings sync can refresh them.
                userStore.setUser(sessionUser, { resetExpiration: false })
                userStore.setSessionActive(true)
                userStore.setSettingsSyncState("loading")
            } else if (hasKratosSession === false) {
                userStore.clearUser()
            } else {
                userStore.setSessionActive(false)
            }
        },
        () => {
            if (!hadCachedUserContext) {
                userStore.clearUser()
            }
        },
    )
    // The bootstrap talks to the backend before first paint, with a 60s
    // request timeout and a retry behind it. Cap the wait: past this the app
    // mounts with whatever context is cached and the result is applied when
    // it lands (App.vue reacts to the store), so an unreachable backend costs
    // a late sync rather than a blank splash for minutes.
    await Promise.race([
        sessionBootstrap,
        new Promise<void>((resolve) => setTimeout(resolve, SESSION_BOOTSTRAP_WAIT_MS)),
    ])
    app.use(i18n)
    app.use(router)
    app.mount('#app')
    void registerAppServiceWorker()
}
