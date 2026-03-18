import './style.css'
import App from './App.vue'
import router from "@/core/router"
import { createApp } from 'vue'
import { watch } from "vue"
import { createPinia } from 'pinia'
import { createPersistedState } from "pinia-plugin-persistedstate";
import { useUserStore } from "@/shared/stores/user";
import { useSettingsStore } from "@/shared/stores/settings";
import { setupInterceptors } from "@/core/http/call-api";
import { i18n, isAppLocale, setI18nLocale } from "@/shared/i18n";
import { bootstrapUserSettingsFromKratosSession } from "@/modules/auth/lib/kratos";


const app = createApp(App)
const pinia = createPinia()
pinia.use(createPersistedState())
app.use(pinia)
const userStore = useUserStore()
const settingsStore = useSettingsStore()
settingsStore.initTheme()
if (isAppLocale(settingsStore.locale)) {
    await setI18nLocale(settingsStore.locale)
}
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
try {
    const { sessionUser, fullUser } = await bootstrapUserSettingsFromKratosSession()
    if (sessionUser) {
        userStore.setUser(sessionUser, { resetExpiration: false })
        userStore.setSessionActive(true)
        userStore.setSettingsSyncState(fullUser ? "synced" : "loading")
    }

    if (fullUser) {
        userStore.setUser(fullUser)
        userStore.setSettingsSyncState("synced")
    } else if (!sessionUser && !userStore.userId) {
        userStore.clearUser()
    }
} catch {
    if (!userStore.userId) {
        userStore.clearUser()
    }
}
app.use(i18n)
app.use(router)
app.mount('#app')
